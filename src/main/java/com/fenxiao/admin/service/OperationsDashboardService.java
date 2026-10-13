package com.fenxiao.admin.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.*;
import java.util.*;

/** Reads registration/verification evidence only. Never refreshes MCN, evaluates grades or writes rewards. */
@Service
@Transactional(readOnly = true)
public class OperationsDashboardService {
    private final JdbcTemplate jdbc;
    private final Clock clock;
    private final Map<Key, Cached> cache = new LinkedHashMap<>();
    private static final Set<String> KINDS = Set.of("REGISTERED", "FIRST_VERIFIED", "COHORT", "PENDING", "OVERDUE", "REJECTED", "WAITING", "UNASSIGNED", "INVITER");

    // The first version is immutable: later transfers must not rewrite acquisition results.
    private static final String FROM = """
             FROM user_distribution_profile u
             LEFT JOIN invitation_relation_version r ON r.user_id=u.user_id AND r.version_no=1 AND r.source_type='INVITE_CODE'
             LEFT JOIN platform_account_binding t ON t.user_id=u.user_id AND t.platform_code='TIMO'
             LEFT JOIN linky_account_binding l ON l.user_id=u.user_id
               AND l.id=(SELECT MAX(latest.id) FROM linky_account_binding latest WHERE latest.user_id=u.user_id)
             LEFT JOIN user_operations_profile op ON op.user_id=u.user_id
            """;
    private static final String TIMO_STATUS = """
            CASE WHEN t.id IS NULL OR t.binding_status='UNBOUND' THEN 'UNBOUND'
                 WHEN t.binding_status='VERIFIED' AND t.verification_source IN ('LOCAL_MOCK','MOCK') THEN 'UNKNOWN'
                 WHEN t.binding_status IN ('SUBMITTED','VERIFYING') THEN 'VERIFYING'
                 WHEN t.binding_status IN ('VERIFIED','REJECTED') THEN CONCAT(t.binding_status,'') ELSE 'UNKNOWN' END
            """;
    private static final String LINKY_STATUS = """
            CASE WHEN l.id IS NULL THEN 'UNBOUND'
                 WHEN l.registration_eligibility='ELIGIBLE' AND l.guild_check_status='MATCHED_OURS'
                   AND (SELECT a.verification_source FROM linky_verification_attempt a WHERE a.user_id=u.user_id ORDER BY a.id DESC LIMIT 1)='MOCK' THEN 'UNKNOWN'
                 WHEN l.registration_eligibility='ELIGIBLE' AND l.guild_check_status='MATCHED_OURS' THEN 'VERIFIED'
                 WHEN l.guild_check_status='PENDING' THEN 'VERIFYING'
                 WHEN l.guild_check_status='REFRESH_FAILED' THEN 'UNKNOWN' ELSE 'REJECTED' END
            """;

    public OperationsDashboardService(JdbcTemplate jdbc, Clock clock) { this.jdbc=jdbc; this.clock=clock; }

    /** Existing callers retain their 7/30-day trend when no explicit shortcut is selected. */
    public Report report(String platformValue, String countryValue, int trendDays, String periodValue) {
        return report(platformValue,countryValue,trendDays,periodValue,null);
    }
    /** Bounded filter cache, at most 60s old. Controllers recheck permission before every hit. */
    public synchronized Report report(String platformValue, String countryValue, int trendDays, String periodValue, String trendPeriod) {
        Key key=key(platformValue,countryValue,trendDays,periodValue,trendPeriod);
        Instant instant=clock.instant();
        Cached cached=cache.get(key);
        if(cached!=null && !instant.isBefore(cached.at()) && instant.isBefore(cached.at().plusSeconds(60))
                && cached.at().atOffset(ZoneOffset.UTC).toLocalDate().equals(instant.atOffset(ZoneOffset.UTC).toLocalDate())) return cached.report();
        Report result=readReport(key,LocalDateTime.ofInstant(instant,ZoneOffset.UTC));
        if(cache.size()>=64) cache.remove(cache.keySet().iterator().next());
        cache.put(key,new Cached(instant,result));
        return result;
    }

    private Report readReport(Key key, LocalDateTime now) {
        LocalDate today=now.toLocalDate();
        LocalDateTime start=today.atStartOfDay();
        String where=" WHERE u.registered_at<?"+countryClause(key.country());
        List<Object> base=new ArrayList<>(List.of(ts(now))); countryArg(base,key.country());
        String state=status(key.platform());
        String waiting=pendingSince(key.platform());
        List<Object> summaryArgs=new ArrayList<>(List.of(ts(start),ts(start),ts(start),ts(start.minusDays(1)),ts(now.minusDays(1)),ts(now.minusHours(24)),ts(now.minusHours(24))));
        summaryArgs.addAll(base);
        Summary summary=jdbc.queryForObject("""
                SELECT COALESCE(SUM(CASE WHEN u.registered_at>=? THEN 1 ELSE 0 END),0),
                       COALESCE(SUM(CASE WHEN u.registered_at>=? AND r.inviter_user_id IS NOT NULL THEN 1 ELSE 0 END),0),
                       COALESCE(SUM(CASE WHEN u.registered_at>=? AND (%s)='VERIFIED' THEN 1 ELSE 0 END),0),
                       COALESCE(SUM(CASE WHEN u.registered_at>=? AND u.registered_at<? THEN 1 ELSE 0 END),0),
                       COALESCE(SUM(CASE WHEN (%s)='VERIFYING' THEN 1 ELSE 0 END),0),
                       COALESCE(SUM(CASE WHEN u.registered_at<? AND (%s)<>'VERIFIED' AND (%s)<>'VERIFIED' THEN 1 ELSE 0 END),0),
                       COALESCE(SUM(CASE WHEN (%s) IN ('REJECTED','UNKNOWN') THEN 1 ELSE 0 END),0),
                       COALESCE(SUM(CASE WHEN (%s)='VERIFYING' AND (%s)<? THEN 1 ELSE 0 END),0),
                       COALESCE(SUM(CASE WHEN op.operator_admin_id IS NULL THEN 1 ELSE 0 END),0)
                """.formatted(state,state,TIMO_STATUS,LINKY_STATUS,state,state,waiting)+FROM+where,
                (rs,n)->new Summary(rs.getLong(1),rs.getLong(2),rs.getLong(3),rs.getLong(4),rs.getLong(5),rs.getLong(6),rs.getLong(7),rs.getLong(8),rs.getLong(9)),
                summaryArgs.toArray());
        List<Day> days=new ArrayList<>();
        Map<LocalDate,Long> registrations=new HashMap<>();
        LocalDate trendLastDay="yesterday".equals(key.trendPeriod())?today.minusDays(1):today;
        // Read through now even for yesterday, so today's first-success card keeps its independent scope.
        List<Object> trendArgs=new ArrayList<>(List.of(ts(trendLastDay.minusDays(key.days()-1).atStartOfDay()),ts(now)));countryArg(trendArgs,key.country());
        jdbc.query("SELECT CAST(u.registered_at AS DATE) day_at, COUNT(*) n FROM user_distribution_profile u WHERE u.registered_at>=? AND u.registered_at<?"+countryClause(key.country())+" GROUP BY CAST(u.registered_at AS DATE)",rs->{registrations.put(rs.getDate(1).toLocalDate(),rs.getLong(2));},trendArgs.toArray());
        Map<LocalDate,Long> successes=new HashMap<>();
        String events=firstEvents(key.platform());
        jdbc.query("SELECT CAST(v.event_at AS DATE),COUNT(*) FROM ("+events+") v JOIN user_distribution_profile u ON u.user_id=v.user_id WHERE v.event_at>=? AND v.event_at<?"+countryClause(key.country())+" GROUP BY CAST(v.event_at AS DATE)",rs->{successes.put(rs.getDate(1).toLocalDate(),rs.getLong(2));},trendArgs.toArray());
        long missing=jdbc.queryForObject("SELECT COUNT(*)"+FROM+where+" AND ("+state+")='VERIFIED' AND NOT EXISTS (SELECT 1 FROM ("+events+") evidence WHERE evidence.user_id=u.user_id)",Long.class,base.toArray());
        for(int i=key.days()-1;i>=0;i--) { LocalDate d=trendLastDay.minusDays(i); days.add(new Day(d,registrations.getOrDefault(d,0L),missing==0?successes.getOrDefault(d,0L):null)); }
        Window window=window(key.period(),now);
        List<Object> rankArgs=new ArrayList<>(List.of(ts(window.start()),ts(window.end())));countryArg(rankArgs,key.country());
        List<Rank> ranks=jdbc.query("SELECT r.inviter_user_id,p.nickname,COUNT(*),SUM(CASE WHEN ("+state+")='VERIFIED' THEN 1 ELSE 0 END)"+FROM+" LEFT JOIN user_public_profile p ON p.user_id=r.inviter_user_id WHERE u.registered_at>=? AND u.registered_at<?"+countryClause(key.country())+" AND r.inviter_user_id IS NOT NULL GROUP BY r.inviter_user_id,p.nickname ORDER BY COUNT(*) DESC,r.inviter_user_id ASC LIMIT 10",(rs,n)->new Rank(rs.getLong(1),rs.getString(2),rs.getLong(3),rs.getLong(4)),rankArgs.toArray());
        List<String> countries=jdbc.queryForList("SELECT DISTINCT country_code FROM user_distribution_profile ORDER BY country_code",String.class);
        return new Report(key.platform(),key.country(),now.toInstant(ZoneOffset.UTC),60,summary,missing==0?successes.getOrDefault(today,0L):null,missing,days,key.period(),window.start(),window.end(),ranks,countries);
    }

    public Users users(String platformValue,String countryValue,String periodValue,String kindValue,Long inviterId,String dateValue,int page,int size) {
        Key key=key(platformValue,countryValue,7,periodValue);
        String kind=kindValue==null?"":kindValue.toUpperCase(Locale.ROOT);
        if(!KINDS.contains(kind)||page<0||page>1000||size<1||size>50) throw new IllegalArgumentException("invalid dashboard user query");
        if("INVITER".equals(kind)&&(inviterId==null||inviterId<=0))throw new IllegalArgumentException("inviter is required");
        LocalDateTime now=LocalDateTime.ofInstant(clock.instant(),ZoneOffset.UTC);
        LocalDate date;
        try {date=dateValue==null||dateValue.isBlank()?now.toLocalDate():LocalDate.parse(dateValue);}
        catch(java.time.format.DateTimeParseException ex){throw new IllegalArgumentException("invalid dashboard date",ex);}
        if(date.isBefore(now.toLocalDate().minusDays(29))||date.isAfter(now.toLocalDate()))throw new IllegalArgumentException("date outside dashboard range");
        String state=status(key.platform());
        List<Object> args=new ArrayList<>(List.of(ts(now)));countryArg(args,key.country());
        String predicate=" WHERE u.registered_at<?"+countryClause(key.country());
        switch(kind) {
            case "REGISTERED","COHORT" -> { predicate+=" AND u.registered_at>=? AND u.registered_at<?";args.add(ts(date.atStartOfDay()));args.add(ts(date.equals(now.toLocalDate())?now:date.plusDays(1).atStartOfDay())); }
            case "FIRST_VERIFIED" -> {predicate+=" AND EXISTS (SELECT 1 FROM ("+firstEvents(key.platform())+") v WHERE v.user_id=u.user_id AND v.event_at>=? AND v.event_at<?)";args.add(ts(date.atStartOfDay()));args.add(ts(date.equals(now.toLocalDate())?now:date.plusDays(1).atStartOfDay()));}
            case "PENDING" -> predicate+=" AND ("+state+")='VERIFYING'";
            case "OVERDUE" -> {predicate+=" AND u.registered_at<? AND ("+TIMO_STATUS+")<>'VERIFIED' AND ("+LINKY_STATUS+")<>'VERIFIED'";args.add(ts(now.minusHours(24)));}
            case "REJECTED" -> predicate+=" AND ("+state+") IN ('REJECTED','UNKNOWN')";
            case "WAITING" -> {predicate+=" AND ("+state+")='VERIFYING' AND ("+pendingSince(key.platform())+")<?";args.add(ts(now.minusHours(24)));}
            case "UNASSIGNED" -> predicate+=" AND op.operator_admin_id IS NULL";
            case "INVITER" -> {Window w=window(key.period(),now);predicate+=" AND r.inviter_user_id=? AND u.registered_at>=? AND u.registered_at<?";args.add(inviterId);args.add(ts(w.start()));args.add(ts(w.end()));}
            default -> throw new IllegalArgumentException("unsupported dashboard query");
        }
        long total=jdbc.queryForObject("SELECT COUNT(*)"+FROM+predicate,Long.class,args.toArray());
        List<Object> paged=new ArrayList<>(args);paged.add(size);paged.add((long)page*size);
        List<User> items=jdbc.query("SELECT u.user_id,p.nickname,u.country_code,u.registered_at,("+state+") binding_status,a.display_name,r.inviter_user_id"+FROM+" LEFT JOIN user_public_profile p ON p.user_id=u.user_id LEFT JOIN admin_account a ON a.id=op.operator_admin_id"+predicate+" ORDER BY u.registered_at DESC,u.user_id DESC LIMIT ? OFFSET ?",(rs,n)->new User(rs.getLong(1),rs.getString(2),rs.getString(3),rs.getTimestamp(4).toLocalDateTime(),rs.getString(5),rs.getString(6),rs.getObject(7)==null?null:rs.getLong(7)),paged.toArray());
        return new Users(items,total,page,size,now.toInstant(ZoneOffset.UTC));
    }

    private static String status(String platform) {return "TIMO".equals(platform)?TIMO_STATUS:LINKY_STATUS;}
    private static String pendingSince(String platform) {return "TIMO".equals(platform)?"COALESCE((SELECT MAX(h.occurred_at) FROM platform_binding_history h WHERE h.binding_id=t.id AND h.to_status='VERIFYING' AND (h.from_status IS NULL OR h.from_status<>'VERIFYING')),t.submitted_at)":"l.created_at";}
    private static String firstEvents(String platform) {
        // Retained successful evidence, not mutable verified_at. Mock successes are not operating results.
        return "TIMO".equals(platform)?"""
                SELECT h.user_id,h.occurred_at event_at FROM platform_binding_history h
                WHERE h.platform_code='TIMO' AND h.to_status='VERIFIED' AND h.source_system NOT IN ('MOCK','LOCAL_MOCK')
                AND NOT EXISTS (SELECT 1 FROM platform_binding_history e WHERE e.platform_code='TIMO' AND e.user_id=h.user_id
                   AND e.to_status='VERIFIED' AND e.source_system NOT IN ('MOCK','LOCAL_MOCK')
                   AND (e.occurred_at<h.occurred_at OR (e.occurred_at=h.occurred_at AND e.id<h.id)))
                """:"""
                SELECT h.user_id,h.attempted_at event_at FROM linky_verification_attempt h
                WHERE h.user_id IS NOT NULL AND h.result_status IN ('FOUND','ELIGIBLE') AND h.membership_status='IN_EXPECTED_GUILD' AND h.verification_source<>'MOCK'
                AND NOT EXISTS (SELECT 1 FROM linky_verification_attempt e WHERE e.user_id=h.user_id
                   AND e.result_status IN ('FOUND','ELIGIBLE') AND e.membership_status='IN_EXPECTED_GUILD' AND e.verification_source<>'MOCK'
                   AND (e.attempted_at<h.attempted_at OR (e.attempted_at=h.attempted_at AND e.id<h.id)))
                """;
    }
    private static String countryClause(String country) {return "ALL".equals(country)?"":" AND u.country_code=?";}
    private static void countryArg(List<Object> args,String country){if(!"ALL".equals(country))args.add(country);}
    private static Timestamp ts(LocalDateTime at){return Timestamp.valueOf(at);}
    private static Key key(String platform,String country,int days,String period) {
        return key(platform,country,days,period,null);
    }
    private static Key key(String platform,String country,int days,String period,String trendPeriod) {
        String p=platform==null?"":platform.trim().toUpperCase(Locale.ROOT);
        String c=country==null||country.isBlank()?"ALL":country.trim().toUpperCase(Locale.ROOT);
        String r=period==null?"today":period.toLowerCase(Locale.ROOT);
        String trend=trendPeriod==null?String.valueOf(days):trendPeriod.toLowerCase(Locale.ROOT);
        Set<String> periods=Set.of("today","yesterday","3","7","30");
        if(!Set.of("TIMO","LINKY").contains(p)||!(c.equals("ALL")||c.matches("[A-Z]{2}"))||!Set.of(7,30).contains(days)||!periods.contains(r)||!periods.contains(trend))throw new IllegalArgumentException("invalid dashboard filters");
        int effectiveDays=switch(trend){case "today","yesterday"->1;case "3"->3;case "30"->30;default->7;};
        return new Key(p,c,effectiveDays,r,trend);
    }
    private static Window window(String period,LocalDateTime now) {
        LocalDateTime start=now.toLocalDate().atStartOfDay();
        return switch(period){case "yesterday"->new Window(start.minusDays(1),start);case "3"->new Window(start.minusDays(2),now);case "7"->new Window(start.minusDays(6),now);case "30"->new Window(start.minusDays(29),now);default->new Window(start,now);};
    }
    private record Key(String platform,String country,int days,String period,String trendPeriod){}
    private record Cached(Instant at,Report report){}
    private record Window(LocalDateTime start,LocalDateTime end){}
    public record Summary(long registered,long invited,long cohortVerified,long yesterdaySameTime,long pending,long overdue,long rejected,long waiting,long unassigned){}
    public record Day(LocalDate date,long registered,Long firstVerified){}
    public record Rank(long inviterId,String nickname,long registered,long verified){}
    public record Report(String platformCode,String countryCode,Instant generatedAt,int refreshSeconds,Summary summary,Long firstVerified,long missingVerificationHistoryUsers,List<Day> trend,String period,LocalDateTime periodStart,LocalDateTime periodEnd,List<Rank> ranks,List<String> countries){}
    public record User(long userId,String nickname,String countryCode,LocalDateTime registeredAt,String bindingStatus,String operatorName,Long registrationInviterId){}
    public record Users(List<User> items,long total,int page,int size,Instant generatedAt){}
}
