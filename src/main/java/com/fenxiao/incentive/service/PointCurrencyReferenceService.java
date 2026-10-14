package com.fenxiao.incentive.service;

import com.fenxiao.admin.service.AdminSessionService;
import com.fenxiao.audit.entity.OperationAuditLog;
import com.fenxiao.audit.repository.OperationAuditLogRepository;
import com.fenxiao.incentive.dto.PointCurrencyReferenceDtos.*;
import com.fenxiao.user.repository.UserDistributionProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.*;

/** Current-country reference valuation, deliberately independent of rewards, withdrawals and payments. */
@Service
@Transactional(readOnly=true)
public class PointCurrencyReferenceService {
    private static final List<Country> COUNTRIES=List.of(
            new Country("CN","中国","CNY",2),new Country("ID","印度尼西亚","IDR",2),
            new Country("MX","墨西哥","MXN",2),new Country("BR","巴西","BRL",2),new Country("HK","香港","HKD",2));
    private static final String SELECT="SELECT id,version_no,currency_per_point,enabled,effective_at,cancelled,created_by,created_at FROM point_currency_rate_version";
    private final JdbcTemplate jdbc;
    private final OperationAuditLogRepository audits;
    private final UserDistributionProfileRepository users;
    private final Clock clock;

    public PointCurrencyReferenceService(JdbcTemplate jdbc, OperationAuditLogRepository audits,
                                         UserDistributionProfileRepository users, Clock clock) {
        this.jdbc=jdbc;this.audits=audits;this.users=users;this.clock=clock;
    }

    public Dashboard dashboard() {
        Instant now=now();
        return new Dashboard(true,now,COUNTRIES.stream().map(c->setting(c,now)).toList());
    }

    public History history(String code, Integer beforeVersion) {
        Country country=country(code);
        if(beforeVersion!=null&&beforeVersion<1)throw new IllegalArgumentException("历史版本游标无效");
        Instant now=now();Stored current=current(country.countryCode(),now);
        List<Stored> values=jdbc.query(SELECT+" WHERE country_code=? AND version_no<? ORDER BY version_no DESC LIMIT 51",
                (rs,n)->stored(rs),country.countryCode(),beforeVersion==null?Integer.MAX_VALUE:beforeVersion);
        boolean more=values.size()>50;
        List<Stored> page=values.subList(0,Math.min(50,values.size()));
        return new History(page.stream().map(r->rate(r,current,now)).toList(),more?page.getLast().version():null);
    }

    /** Appends a version; existing values are never edited. Only one future reservation is retained. */
    @Transactional
    public Setting save(String code, SaveRequest request, AdminSessionService.AdminPrincipal actor) {
        Country country=country(code);Instant now=now();
        actor.requireScope(null,null,country.countryCode());
        validateRate(request);
        Instant effective=request.effectiveAt()==null?now:request.effectiveAt().truncatedTo(ChronoUnit.MILLIS);
        if(effective.isBefore(now))throw new IllegalArgumentException("生效时间不能早于当前时间；立即生效请留空");
        // A stable per-country row serializes saves, including the first ever configuration.
        jdbc.queryForObject("SELECT country_code FROM point_currency_country WHERE country_code=? FOR UPDATE",String.class,country.countryCode());
        int version=latestVersion(country.countryCode());
        if(request.expectedVersion()==null||request.expectedVersion()!=version)
            throw new ResponseStatusException(HttpStatus.CONFLICT,"配置已被其他人修改，请刷新后重试");
        Setting before=setting(country,now);
        int cancelled=jdbc.update("UPDATE point_currency_rate_version SET cancelled=TRUE,cancelled_at=?,cancelled_by=? WHERE country_code=? AND cancelled=FALSE AND effective_at>?",
                Timestamp.from(now),actor.accountId(),country.countryCode(),Timestamp.from(now));
        var keys=new GeneratedKeyHolder();
        jdbc.update(connection->{var s=connection.prepareStatement("INSERT INTO point_currency_rate_version(country_code,version_no,currency_per_point,enabled,effective_at,created_by,created_at) VALUES(?,?,?,?,?,?,?)",new String[]{"id"});
            s.setString(1,country.countryCode());s.setInt(2,version+1);s.setBigDecimal(3,request.currencyPerPoint());
            s.setBoolean(4,request.enabled());s.setTimestamp(5,Timestamp.from(effective));s.setLong(6,actor.accountId());s.setTimestamp(7,Timestamp.from(now));return s;},keys);
        long id=Objects.requireNonNull(keys.getKey()).longValue();
        Setting after=setting(country,now);
        audits.save(OperationAuditLog.create(actor.accountId(),actor.role(),"point_currency_reference","point_currency_rate_version",id,
                "SAVE_REFERENCE_VERSION",snapshot(before),"country="+country.countryCode()+";currency="+country.currencyCode()+";version="+(version+1)+";rate="+plain(request.currencyPerPoint())+";enabled="+request.enabled()+";effectiveAt="+effective+";cancelledPending="+cancelled,
                null,"仅更新参考金额汇率；替换未生效预约，不改积分或开放提现",LocalDateTime.ofInstant(now,ZoneOffset.UTC)));
        return after;
    }

    /** Admin preview: a user ID always derives its current country on the server, never from a client override. */
    public Quote preview(PreviewRequest request, AdminSessionService.AdminPrincipal actor) {
        validatePoints(request.points());
        boolean hasCountry=request.countryCode()!=null&&!request.countryCode().isBlank();
        if((request.userId()!=null)==hasCountry)throw new IllegalArgumentException("请选择国家试算或用户试算，不能同时指定");
        String code;
        if(request.userId()!=null) {
            code=users.findById(request.userId()).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"用户不存在")).getCountryCode();
        } else code=country(request.countryCode()).countryCode();
        actor.requireScope(null,null,code);
        return quote(request.points(),code);
    }

    private Quote quote(BigDecimal points,String code) {
        Instant now=now();String normalized=normalize(code);
        Country country=COUNTRIES.stream().filter(c->c.countryCode().equals(normalized)).findFirst().orElse(null);
        if(country==null)return new Quote(true,"UNSUPPORTED_COUNTRY",normalized,null,plain(points),null,null,null,null,now);
        Stored stored=current(country.countryCode(),now);
        String status=stored==null?"NOT_CONFIGURED":!stored.enabled()?"DISABLED":"CONFIGURED";
        String amount=stored!=null&&stored.enabled()?points.multiply(stored.value()).setScale(country.fractionDigits(),RoundingMode.HALF_UP).toPlainString():null;
        return new Quote(true,status,country.countryCode(),country.currencyCode(),plain(points),stored==null?null:plain(stored.value()),amount,
                stored==null?null:stored.id(),stored==null?null:stored.effectiveAt(),now);
    }

    private Setting setting(Country country,Instant now) {
        Stored current=current(country.countryCode(),now);
        List<Stored> future=jdbc.query(SELECT+" WHERE country_code=? AND cancelled=FALSE AND effective_at>? ORDER BY effective_at,version_no LIMIT 1",(rs,n)->stored(rs),country.countryCode(),Timestamp.from(now));
        return new Setting(country,latestVersion(country.countryCode()),current==null?null:rate(current,current,now),future.isEmpty()?null:rate(future.getFirst(),current,now));
    }
    private Stored current(String country,Instant now) {
        List<Stored> values=jdbc.query(SELECT+" WHERE country_code=? AND cancelled=FALSE AND effective_at<=? ORDER BY effective_at DESC,version_no DESC LIMIT 1",(rs,n)->stored(rs),country,Timestamp.from(now));
        return values.isEmpty()?null:values.getFirst();
    }
    private int latestVersion(String country) {return Objects.requireNonNull(jdbc.queryForObject("SELECT COALESCE(MAX(version_no),0) FROM point_currency_rate_version WHERE country_code=?",Integer.class,country));}
    private Stored stored(java.sql.ResultSet rs)throws java.sql.SQLException {
        return new Stored(rs.getLong(1),rs.getInt(2),rs.getBigDecimal(3),rs.getBoolean(4),rs.getTimestamp(5).toInstant(),rs.getBoolean(6),rs.getLong(7),rs.getTimestamp(8).toInstant());
    }
    private Rate rate(Stored value,Stored current,Instant now) {
        String status=value.cancelled()?"CANCELLED":value.effectiveAt().isAfter(now)?"SCHEDULED":current!=null&&current.id()==value.id()?(value.enabled()?"ACTIVE":"DISABLED"):"SUPERSEDED";
        return new Rate(value.id(),value.version(),plain(value.value()),value.enabled(),status,value.effectiveAt(),value.createdBy(),value.createdAt());
    }
    private void validateRate(SaveRequest request) {
        if(request.enabled()==null)throw new IllegalArgumentException("请选择启用或停用");
        BigDecimal rate=request.currencyPerPoint();
        if(request.enabled()&&rate==null)throw new IllegalArgumentException("启用时必须填写每积分货币金额");
        if(rate!=null&&(rate.signum()<=0||rate.scale()>8||rate.precision()-rate.scale()>12))throw new IllegalArgumentException("汇率必须大于0，最多12位整数和8位小数");
    }
    private void validatePoints(BigDecimal points) {
        if(points==null||points.signum()<0||points.scale()>6||points.precision()-points.scale()>12)throw new IllegalArgumentException("积分须为非负数，最多12位整数和6位小数");
    }
    private Country country(String code) {String normalized=normalize(code);return COUNTRIES.stream().filter(c->c.countryCode().equals(normalized)).findFirst().orElseThrow(()->new IllegalArgumentException("暂不支持该国家／地区"));}
    private String normalize(String code) {return code==null?null:code.trim().toUpperCase(Locale.ROOT);}
    private Instant now() {return clock.instant().truncatedTo(ChronoUnit.MILLIS);}
    private static String plain(BigDecimal value) {return value==null?null:value.stripTrailingZeros().toPlainString();}
    private String snapshot(Setting value) {return "country="+value.country().countryCode()+";currency="+value.country().currencyCode()+";latestVersion="+value.latestVersion()+";current="+value.current()+";scheduled="+value.scheduled();}
    private record Stored(long id,int version,BigDecimal value,boolean enabled,Instant effectiveAt,boolean cancelled,long createdBy,Instant createdAt) { }
}
