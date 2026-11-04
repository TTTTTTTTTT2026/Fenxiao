package com.fenxiao.distribution.service;

import com.fenxiao.admin.service.AdminSessionService.AdminPrincipal;
import com.fenxiao.audit.repository.OperationAuditLogRepository;
import com.fenxiao.platform.mcn.McnLinkyVerificationProperties;
import com.fenxiao.user.entity.UserDistributionProfile;
import com.fenxiao.user.repository.UserDistributionProfileRepository;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Optional;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class LinkyIndividualBindingTargetServiceTest {
    @Test void configIsAuditedScopedToOneAccountAndAllowsMissingInviteCode() {
        var jdbc=new JdbcTemplate(new DriverManagerDataSource("jdbc:h2:mem:linky_target;MODE=MySQL;DB_CLOSE_DELAY=-1","sa",""));
        jdbc.execute("CREATE TABLE user_linky_binding_target_override(user_id BIGINT PRIMARY KEY,linky_account VARCHAR(8),guild_id VARCHAR(8),guild_name VARCHAR(128),guild_invite_code VARCHAR(128),change_reason VARCHAR(255),changed_by BIGINT,created_at TIMESTAMP,updated_at TIMESTAMP)");
        jdbc.execute("CREATE TABLE platform_guild_directory(platform_code VARCHAR(20),external_guild_id VARCHAR(20),guild_name VARCHAR(128),directory_status VARCHAR(32),guild_status VARCHAR(32))");
        jdbc.execute("CREATE TABLE linky_account_binding(user_id BIGINT,linky_account VARCHAR(8),registration_eligibility VARCHAR(20))");
        jdbc.update("INSERT INTO platform_guild_directory VALUES ('LINKY','31350499','Nova','NORMAL','ACTIVE')");
        var users=mock(UserDistributionProfileRepository.class);when(users.findById(99L)).thenReturn(Optional.of(UserDistributionProfile.create(99L,"BR","pt","TEST")));
        var audit=mock(OperationAuditLogRepository.class);
        var service=new LinkyIndividualBindingTargetService(jdbc,users,new McnLinkyVerificationProperties(),audit,Clock.systemUTC());
        var admin=new AdminPrincipal(1,"admin","admin","super_admin",false,1,false,LocalDateTime.now().plusDays(1),"*","*","*");
        var request=new LinkyIndividualBindingTargetService.Request("87654320","31350499",null,"verified member; individual exception");
        service.set(99,request,admin,null);
        assertThat(service.findForBinding(99,"87654320").orElseThrow().guildId()).isEqualTo("31350499");
        assertThat(service.findForBinding(99,"87654320").orElseThrow().guildInviteCode()).isEmpty();
        assertThat(service.findForBinding(98,"87654320")).isEmpty();
        assertThatThrownBy(()->service.findForBinding(99,"12345678")).isInstanceOf(IllegalStateException.class);
        verify(audit,times(1)).save(any());
        var operator=new AdminPrincipal(2,"ops","ops","operations",false,2,false,LocalDateTime.now().plusDays(1),"*","*","*");
        assertThatThrownBy(()->service.set(99,request,operator,null)).isInstanceOf(com.fenxiao.common.api.ForbiddenException.class);
    }
}
