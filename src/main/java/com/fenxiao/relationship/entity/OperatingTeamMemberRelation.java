package com.fenxiao.relationship.entity;

import com.fenxiao.common.entity.BaseEntity;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name="operating_team_member_relation")
public class OperatingTeamMemberRelation extends BaseEntity {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="team_id",nullable=false) private Long teamId;
    @Column(name="user_id",nullable=false) private Long userId;
    @Column(name="member_role",nullable=false) private String memberRole;
    @Column(name="effective_from",nullable=false) private LocalDateTime effectiveFrom;
    @Column(name="effective_to") private LocalDateTime effectiveTo;
    @Column(name="source_type",nullable=false) private String sourceType;
    @Column(name="source_reference") private String sourceReference;
    protected OperatingTeamMemberRelation() { }
    public static OperatingTeamMemberRelation leader(long teamId,long userId,LocalDateTime at,String source,String reference) {
        OperatingTeamMemberRelation value = new OperatingTeamMemberRelation();
        value.teamId=teamId; value.userId=userId; value.memberRole="LEADER"; value.effectiveFrom=at; value.sourceType=source; value.sourceReference=reference; return value;
    }
}
