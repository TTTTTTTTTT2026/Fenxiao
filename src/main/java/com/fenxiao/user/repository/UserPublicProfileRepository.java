package com.fenxiao.user.repository;

import com.fenxiao.user.entity.UserPublicProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface UserPublicProfileRepository extends JpaRepository<UserPublicProfile, Long> {
    // A directory page must not load avatar BLOBs just to show nicknames.
    @Query("select profile.userId, profile.nickname from UserPublicProfile profile where profile.userId in :userIds")
    List<Object[]> findNicknamesByUserIds(@Param("userIds") Collection<Long> userIds);
}
