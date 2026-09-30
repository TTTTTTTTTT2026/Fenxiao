package com.fenxiao.identity.repository;

import com.fenxiao.identity.entity.UserPasswordCredential;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UserPasswordCredentialRepository extends JpaRepository<UserPasswordCredential, Long> {
    List<UserPasswordCredential> findByUserIdIn(Collection<Long> userIds);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select value from UserPasswordCredential value where value.userId = :userId")
    Optional<UserPasswordCredential> findForLogin(Long userId);
}
