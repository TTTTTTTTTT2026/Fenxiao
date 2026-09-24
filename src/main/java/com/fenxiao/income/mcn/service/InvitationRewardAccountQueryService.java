package com.fenxiao.income.mcn.service;

import com.fenxiao.income.mcn.api.dto.InvitationRewardAccountResponse;
import com.fenxiao.user.repository.UserDistributionProfileRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class InvitationRewardAccountQueryService {
    private final JdbcTemplate jdbc;
    private final UserDistributionProfileRepository users;

    public InvitationRewardAccountQueryService(JdbcTemplate jdbc, UserDistributionProfileRepository users) {
        this.jdbc = jdbc;
        this.users = users;
    }

    public InvitationRewardAccountResponse get(long userId, int page, int size) {
        if (userId <= 0 || !users.existsById(userId)) throw new IllegalArgumentException("user not found");
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(100, size));
        List<BigDecimal[]> balances = jdbc.query("SELECT frozen_points,available_points FROM invitation_reward_account WHERE user_id=?",
                (rs, row) -> new BigDecimal[]{rs.getBigDecimal(1), rs.getBigDecimal(2)}, userId);
        BigDecimal frozen = balances.isEmpty() ? BigDecimal.ZERO : balances.getFirst()[0];
        BigDecimal available = balances.isEmpty() ? BigDecimal.ZERO : balances.getFirst()[1];
        BigDecimal cumulative = jdbc.queryForObject("""
                SELECT COALESCE(SUM(frozen_delta+available_delta),0) FROM invitation_reward_account_ledger
                WHERE user_id=?
                """, BigDecimal.class, userId);
        BigDecimal direct = incomeForLevel(userId, 1);
        BigDecimal indirect = incomeForLevel(userId, 2);
        Long total = jdbc.queryForObject("SELECT COUNT(*) FROM invitation_reward_account_ledger WHERE user_id=?", Long.class, userId);
        List<InvitationRewardAccountResponse.Flow> items = jdbc.query("""
                SELECT l.id,l.event_type,l.frozen_delta,l.available_delta,l.reason,l.created_at,
                       l.platform_code,l.source_event_id,l.reward_level,l.source_user_id,l.raw_diamonds,
                       l.company_share_rate,l.company_income_diamonds,l.invitation_rate,l.reward_diamonds,
                       l.points_per_diamond,l.conversion_id
                FROM invitation_reward_account_ledger l
                WHERE l.user_id=? ORDER BY l.id DESC LIMIT ? OFFSET ?
                """, (rs, row) -> new InvitationRewardAccountResponse.Flow(rs.getLong(1), rs.getString(2),
                rs.getBigDecimal(3), rs.getBigDecimal(4), rs.getString(5), rs.getTimestamp(6).toInstant(),
                rs.getString(7), rs.getString(8), rs.getInt(9), rs.getLong(10), rs.getBigDecimal(11),
                rs.getBigDecimal(12), rs.getBigDecimal(13), rs.getBigDecimal(14), rs.getBigDecimal(15),
                rs.getBigDecimal(16), rs.getLong(17)), userId, safeSize, safePage * safeSize);
        return new InvitationRewardAccountResponse(userId, "POINT", frozen, available,
                frozen.add(available), cumulative == null ? BigDecimal.ZERO : cumulative,
                direct, indirect,
                false, total == null ? 0 : total, safePage, safeSize, items);
    }

    private BigDecimal incomeForLevel(long userId, int level) {
        BigDecimal result = jdbc.queryForObject("""
                SELECT COALESCE(SUM(frozen_delta+available_delta),0) FROM invitation_reward_account_ledger
                WHERE user_id=? AND reward_level=?
                """, BigDecimal.class, userId, level);
        return result == null ? BigDecimal.ZERO : result;
    }
}
