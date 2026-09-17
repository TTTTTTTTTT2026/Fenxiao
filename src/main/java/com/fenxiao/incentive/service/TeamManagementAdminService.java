package com.fenxiao.incentive.service;

import com.fenxiao.admin.service.AdminSessionService;
import com.fenxiao.audit.entity.OperationAuditLog;
import com.fenxiao.audit.repository.OperationAuditLogRepository;
import com.fenxiao.incentive.dto.TeamManagementDashboardResponse;
import com.fenxiao.incentive.dto.TeamManagementItemResponse;
import com.fenxiao.incentive.dto.TeamManagementMemberResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Team governance view. It intentionally has no create, payout or manual leader-grant
 * operation: a future points-based grade engine will create teams.
 */
@Service
@Transactional
public class TeamManagementAdminService {
    private final JdbcTemplate jdbc;
    private final OperationAuditLogRepository audits;
    private final Clock clock;

    public TeamManagementAdminService(JdbcTemplate jdbc, OperationAuditLogRepository audits, Clock clock) {
        this.jdbc = jdbc; this.audits = audits; this.clock = clock;
    }

    @Transactional(readOnly = true)
    public TeamManagementDashboardResponse dashboard() {
        return new TeamManagementDashboardResponse(
                count("select count(*) from operating_team where team_status='ACTIVE'"),
                count("select count(*) from operating_team where team_status='ACTIVE' and leader_user_id is not null"),
                count("select count(*) from operating_team where team_status='ACTIVE' and leader_user_id is not null and operating_profit_share_enabled=true"),
                count("select count(*) from operating_team_member_relation where effective_to is null"),
                teams());
    }

    @Transactional(readOnly = true)
    public List<TeamManagementMemberResponse> members(long teamId) {
        requireTeam(teamId);
        return jdbc.query("select r.user_id,p.phone_number,p.country_code,r.member_role,r.source_type,r.effective_from " +
                        "from operating_team_member_relation r join user_distribution_profile p on p.user_id=r.user_id " +
                        "where r.team_id=? and r.effective_to is null order by case when r.member_role='LEADER' then 0 else 1 end,r.effective_from,r.id",
                (rs, row) -> new TeamManagementMemberResponse(rs.getLong(1), rs.getString(2), rs.getString(3), rs.getString(4), rs.getString(5), rs.getTimestamp(6).toLocalDateTime()), teamId);
    }

    public TeamManagementItemResponse setOperatingProfitShareEnabled(long teamId, boolean enabled, AdminSessionService.AdminPrincipal actor) {
        TeamManagementItemResponse before = team(teamId);
        if (before.leaderUserId() == null) throw new IllegalStateException("only a team with an automatically qualified leader can receive operating-profit-share permission");
        jdbc.update("update operating_team set operating_profit_share_enabled=?,updated_at=? where id=?", enabled, LocalDateTime.now(clock), teamId);
        TeamManagementItemResponse after = team(teamId);
        audits.save(OperationAuditLog.create(actor.accountId(), actor.role(), "team_management", "operating_team", teamId,
                enabled ? "ENABLE_OPERATING_PROFIT_SHARE" : "DISABLE_OPERATING_PROFIT_SHARE", snapshot(before), snapshot(after), null,
                enabled ? "运营已确认允许该团队参与后续团队经营利润分成演算" : "运营已取消该团队参与后续团队经营利润分成演算的许可", LocalDateTime.now(clock)));
        return after;
    }

    private List<TeamManagementItemResponse> teams() {
        String sql = "select t.id,t.team_code,t.team_name,t.country_code,t.leader_user_id,leader.phone_number,t.operating_profit_share_enabled,t.parent_team_id,parent.team_code," +
                "count(distinct member.user_id),fact.platform_code,fact.period_end,fact.operating_profit_minor,fact.currency_code,t.created_at " +
                "from operating_team t " +
                "left join user_distribution_profile leader on leader.user_id=t.leader_user_id " +
                "left join operating_team parent on parent.id=t.parent_team_id " +
                "left join operating_team_member_relation member on member.team_id=t.id and member.effective_to is null " +
                "left join team_profit_fact fact on fact.id=(select latest.id from team_profit_fact latest where latest.team_id=t.id order by latest.received_at desc,latest.id desc limit 1) " +
                "group by t.id,t.team_code,t.team_name,t.country_code,t.leader_user_id,leader.phone_number,t.operating_profit_share_enabled,t.parent_team_id,parent.team_code,fact.platform_code,fact.period_end,fact.operating_profit_minor,fact.currency_code,t.created_at " +
                "order by case when t.leader_user_id is null then 1 else 0 end,t.created_at desc,t.id desc";
        return jdbc.query(sql, this::mapTeam);
    }

    private TeamManagementItemResponse team(long teamId) {
        return teams().stream().filter(item -> item.teamId() == teamId).findFirst().orElseThrow(() -> new IllegalArgumentException("team not found"));
    }

    private TeamManagementItemResponse mapTeam(ResultSet rs, int row) throws SQLException {
        return new TeamManagementItemResponse(rs.getLong(1), rs.getString(2), rs.getString(3), rs.getString(4), nullableLong(rs, 5),
                rs.getString(6), rs.getBoolean(7), nullableLong(rs, 8), rs.getString(9), rs.getLong(10), rs.getString(11),
                rs.getDate(12) == null ? null : rs.getDate(12).toLocalDate(), nullableLong(rs, 13), rs.getString(14), rs.getTimestamp(15).toLocalDateTime());
    }

    private void requireTeam(long teamId) {
        Long found = jdbc.queryForObject("select count(*) from operating_team where id=?", Long.class, teamId);
        if (found == null || found == 0) throw new IllegalArgumentException("team not found");
    }

    private long count(String sql) {
        Long result = jdbc.queryForObject(sql, Long.class);
        return result == null ? 0 : result;
    }

    private Long nullableLong(ResultSet rs, int index) throws SQLException {
        long value = rs.getLong(index);
        return rs.wasNull() ? null : value;
    }

    private String snapshot(TeamManagementItemResponse team) {
        return "team=" + team.teamCode() + ";leader=" + team.leaderUserId() + ";operatingProfitShareEnabled=" + team.operatingProfitShareEnabled();
    }
}
