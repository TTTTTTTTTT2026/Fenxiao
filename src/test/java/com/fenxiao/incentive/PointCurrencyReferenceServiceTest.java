package com.fenxiao.incentive;

import com.fenxiao.admin.service.AdminSessionService.AdminPrincipal;
import com.fenxiao.audit.repository.OperationAuditLogRepository;
import com.fenxiao.common.api.ForbiddenException;
import com.fenxiao.incentive.dto.PointCurrencyReferenceDtos.*;
import com.fenxiao.incentive.service.PointCurrencyReferenceService;
import com.fenxiao.user.entity.UserDistributionProfile;
import com.fenxiao.user.repository.UserDistributionProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class PointCurrencyReferenceServiceTest {
    JdbcTemplate jdbc;PointCurrencyReferenceService service;
    OperationAuditLogRepository audits;UserDistributionProfileRepository users;
    MutableClock clock;
    AdminPrincipal actor=new AdminPrincipal(1,"test","测试财务","finance",false,1,false,LocalDateTime.of(2027,1,1,0,0),"*","*","*");
    @BeforeEach void setup() {
        var ds=new DriverManagerDataSource("jdbc:h2:mem:point_fx_"+UUID.randomUUID()+";MODE=MySQL;DB_CLOSE_DELAY=-1","sa","");
        new ResourceDatabasePopulator(new ClassPathResource("db/migration/V79__add_point_currency_reference_rates.sql")).execute(ds);
        jdbc=new JdbcTemplate(ds);audits=mock(OperationAuditLogRepository.class);users=mock(UserDistributionProfileRepository.class);
        clock=new MutableClock(Instant.parse("2026-10-14T00:00:00Z"));
        service=new PointCurrencyReferenceService(jdbc,audits,users,clock);
        jdbc.execute("CREATE TABLE invitation_reward_account(user_id BIGINT PRIMARY KEY,frozen_points DECIMAL(18,6),available_points DECIMAL(18,6))");
        jdbc.update("INSERT INTO invitation_reward_account VALUES(100,123.456789,20)");
    }
    @Test void migrationSeedsOnlyTheFiveLoginCurrenciesAndNoGuessedPrices() {
        assertThat(service.dashboard().settings()).extracting(s->s.country().currencyCode()).containsExactly("CNY","IDR","MXN","BRL","HKD");
        assertThat(service.dashboard().settings()).allMatch(s->s.current()==null&&s.scheduled()==null&&s.latestVersion()==0);
        assertThat(quote("ID","0").amount()).isNull();assertThat(quote("ID","100").status()).isEqualTo("NOT_CONFIGURED");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM point_currency_rate_version",Integer.class)).isZero();
    }
    @Test void computesExactReferenceAmountsAndNeverChangesPoints() {
        save("ID","150.25",true,null,0);
        Quote quote=quote("ID","100.000001");
        assertThat(quote.referenceOnly()).isTrue();assertThat(quote.currencyCode()).isEqualTo("IDR");
        assertThat(quote.amount()).isEqualTo("15025.00");assertThat(quote.currencyPerPoint()).isEqualTo("150.25");
        assertThat(quote("ID","0").amount()).isEqualTo("0.00");
        assertThat(jdbc.queryForObject("SELECT frozen_points FROM invitation_reward_account WHERE user_id=100",BigDecimal.class)).isEqualByComparingTo("123.456789");
        assertThat(jdbc.queryForObject("SELECT available_points FROM invitation_reward_account WHERE user_id=100",BigDecimal.class)).isEqualByComparingTo("20");
        verify(audits).save(any());
    }
    @Test void roundsOnlyTheFinalMoneyValueAndHandlesLargeDecimalsWithoutFloats() {
        save("CN","0.005",true,null,0);assertThat(quote("CN","1").amount()).isEqualTo("0.01");
        save("ID","999999999999.99999999",true,null,0);
        BigDecimal points=new BigDecimal("999999999999.999999");
        assertThat(quote("ID",points.toPlainString()).amount()).isEqualTo(points.multiply(new BigDecimal("999999999999.99999999")).setScale(2,java.math.RoundingMode.HALF_UP).toPlainString());
    }
    @Test void followsAUsersCurrentCountryAndNeverFallsBackToUsd() {
        var user=UserDistributionProfile.create(100L,"ID","id","SYNTHETIC");when(users.findById(100L)).thenReturn(Optional.of(user));
        save("ID","150",true,null,0);save("BR","0.2",true,null,0);
        assertThat(service.preview(new PreviewRequest(new BigDecimal("100"),null,100L),actor).amount()).isEqualTo("15000.00");
        user.changeCountry("BR");var changed=service.preview(new PreviewRequest(new BigDecimal("100"),null,100L),actor);
        assertThat(changed.currencyCode()).isEqualTo("BRL");assertThat(changed.amount()).isEqualTo("20.00");
        user.changeCountry("HK");assertThat(service.preview(new PreviewRequest(BigDecimal.ONE,null,100L),actor).amount()).isNull();
        user.changeCountry("US");var unsupported=service.preview(new PreviewRequest(BigDecimal.ONE,null,100L),actor);
        assertThat(unsupported.status()).isEqualTo("UNSUPPORTED_COUNTRY");assertThat(unsupported.currencyCode()).isNull();
        assertThatThrownBy(()->service.preview(new PreviewRequest(BigDecimal.ONE,"ID",100L),actor)).isInstanceOf(IllegalArgumentException.class);
    }
    @Test void disablesAndReenablesByAppendingVersionsWithoutEditingOldAmounts() {
        save("ID","100",true,null,0);save("ID",null,false,null,1);
        assertThat(quote("ID","1").status()).isEqualTo("DISABLED");assertThat(quote("ID","1").amount()).isNull();
        save("ID","200",true,null,2);
        assertThat(quote("ID","1").amount()).isEqualTo("200.00");
        assertThat(service.history("ID",null).items()).extracting(Rate::version).containsExactly(3,2,1);
        assertThat(service.history("ID",null).items().getLast().currencyPerPoint()).isEqualTo("100");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM invitation_reward_account",Integer.class)).isEqualTo(1);
    }
    @Test void scheduledRatesApplyAtTheExactUtcBoundaryAndDoNotUseABrowserCountry() {
        save("ID","100",true,null,0);Instant future=clock.instant().plusSeconds(3600);
        save("ID","200",true,future,1);
        assertThat(quote("ID","1").amount()).isEqualTo("100.00");
        assertThat(service.dashboard().settings().get(1).scheduled().status()).isEqualTo("SCHEDULED");
        clock.value=future;assertThat(quote("ID","1").amount()).isEqualTo("200.00");
        assertThat(service.dashboard().settings().get(1).scheduled()).isNull();
    }
    @Test void savingOrDisablingCancelsAnOldPendingReservationButKeepsItsHistory() {
        Instant future=clock.instant().plusSeconds(3600);save("ID","200",true,future,0);
        save("ID",null,false,null,1);clock.value=future;
        assertThat(quote("ID","1").status()).isEqualTo("DISABLED");
        assertThat(service.history("ID",null).items().getLast().status()).isEqualTo("CANCELLED");
        assertThat(service.history("ID",null).items().getLast().currencyPerPoint()).isEqualTo("200");
    }
    @Test void refusesStaleSavesWithoutCancellingTheOtherOperatorsReservation() {
        save("ID","150",true,clock.instant().plusSeconds(3600),0);
        assertThatThrownBy(()->save("ID","200",true,null,0)).isInstanceOf(ResponseStatusException.class)
                .satisfies(e->assertThat(((ResponseStatusException)e).getStatusCode().value()).isEqualTo(409));
        assertThat(service.dashboard().settings().get(1).scheduled().currencyPerPoint()).isEqualTo("150");
        verify(audits,times(1)).save(any());
    }
    @Test void rejectsInvalidRatesPointsAndBackdatedSettings() {
        for(String bad:List.of("0","-1","0.000000001","1000000000000"))assertThatThrownBy(()->save("ID",bad,true,null,0)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(()->save("ID",null,true,null,0)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(()->save("US","1",true,null,0)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(()->save("ID","1",true,clock.instant().minusSeconds(1),0)).isInstanceOf(IllegalArgumentException.class);
        for(String bad:List.of("-1","0.0000001","1000000000000"))assertThatThrownBy(()->quote("ID",bad)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(()->service.preview(new PreviewRequest(BigDecimal.ONE,null,null),actor)).isInstanceOf(IllegalArgumentException.class);
    }
    @Test void enforcesRegionalWriteAndUserPreviewScope() {
        var limited=new AdminPrincipal(2,"scoped","地区财务","finance",false,2,false,actor.expiresAt(),"*","*","ID");
        assertThatThrownBy(()->service.save("BR",new SaveRequest(true,BigDecimal.ONE,null,0),limited)).isInstanceOf(ForbiddenException.class);
        when(users.findById(100L)).thenReturn(Optional.of(UserDistributionProfile.create(100L,"BR","pt","SYNTHETIC")));
        assertThatThrownBy(()->service.preview(new PreviewRequest(BigDecimal.ONE,null,100L),limited)).isInstanceOf(ForbiddenException.class);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM point_currency_rate_version",Integer.class)).isZero();
    }
    @Test void paginatesHistoryWithoutLosingVersions() {
        for(int v=0;v<52;v++)save("ID",Integer.toString(v+1),true,null,v);
        History first=service.history("ID",null);assertThat(first.items()).hasSize(50);assertThat(first.nextBeforeVersion()).isEqualTo(3);
        assertThat(service.history("ID",first.nextBeforeVersion()).items()).extracting(Rate::version).containsExactly(2,1);
    }
    private Setting save(String code,String value,boolean enabled,Instant at,int version) {return service.save(code,new SaveRequest(enabled,value==null?null:new BigDecimal(value),at,version),actor);}
    private Quote quote(String code,String points) {return service.preview(new PreviewRequest(new BigDecimal(points),code,null),actor);}
    static class MutableClock extends Clock {
        Instant value;MutableClock(Instant value){this.value=value;}
        public ZoneId getZone(){return ZoneOffset.UTC;}public Clock withZone(ZoneId zone){return this;}public Instant instant(){return value;}
    }
}
