package com.fenxiao.relationship.entity;

import com.fenxiao.common.entity.BaseEntity;
import jakarta.persistence.*;

@Entity
@Table(name="operating_team")
public class OperatingTeam extends BaseEntity {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="team_code",nullable=false,unique=true) private String teamCode;
    @Column(name="team_name",nullable=false) private String teamName;
    @Column(name="country_code",nullable=false) private String countryCode;
    @Column(name="leader_user_id") private Long leaderUserId;
    @Column(name="team_status",nullable=false) private String teamStatus;
    @Column(name="operating_profit_share_enabled",nullable=false) private boolean operatingProfitShareEnabled;
    @Column(name="leader_qualification_status",nullable=false) private String leaderQualificationStatus;
    @Column(name="team_establishment_status",nullable=false) private String teamEstablishmentStatus;
    @Column(name="leader_appointment_status",nullable=false) private String leaderAppointmentStatus;
    @Column(name="leadership_source") private String leadershipSource;
    @Column(name="leader_appointed_at") private java.time.LocalDateTime leaderAppointedAt;
    protected OperatingTeam(){}
    public static OperatingTeam create(String code,String name,String country,Long leader){var t=new OperatingTeam();t.teamCode=code;t.teamName=name;t.countryCode=country;t.leaderUserId=leader;t.teamStatus="ACTIVE";t.operatingProfitShareEnabled=false;t.leaderQualificationStatus=leader == null ? "NOT_APPLICABLE" : "LEGACY_UNVERIFIED";t.teamEstablishmentStatus=leader == null ? "SYSTEM_HOLDING" : "LEGACY_UNVERIFIED";t.leaderAppointmentStatus=leader == null ? "NOT_APPLICABLE" : "LEGACY_UNVERIFIED";t.leadershipSource=leader == null ? "SYSTEM_HOLDING" : "LEGACY_DIRECT_ROLE";return t;}
    public static OperatingTeam createGoldQualified(String code,String name,String country,Long leader,java.time.LocalDateTime at){var t=create(code,name,country,leader);t.leaderQualificationStatus="QUALIFIED";t.teamEstablishmentStatus="AUTO_CREATED";t.leaderAppointmentStatus="AUTO_CONFIRMED";t.leadershipSource="GOLD_GRADE_RULE";t.leaderAppointedAt=at;return t;}
    public Long getId(){return id;} public String getTeamCode(){return teamCode;} public String getCountryCode(){return countryCode;} public Long getLeaderUserId(){return leaderUserId;} public boolean isOperatingProfitShareEnabled(){return operatingProfitShareEnabled;}
    public String getLeaderQualificationStatus(){return leaderQualificationStatus;} public String getTeamEstablishmentStatus(){return teamEstablishmentStatus;} public String getLeaderAppointmentStatus(){return leaderAppointmentStatus;} public String getLeadershipSource(){return leadershipSource;} public java.time.LocalDateTime getLeaderAppointedAt(){return leaderAppointedAt;}
    public void confirmLeadershipAppointment(String source,java.time.LocalDateTime at){if(leaderUserId == null)throw new IllegalStateException("team has no leader candidate");leaderQualificationStatus="QUALIFIED";teamEstablishmentStatus="CONFIRMED";leaderAppointmentStatus="CONFIRMED";leadershipSource=source;leaderAppointedAt=at;}
}
