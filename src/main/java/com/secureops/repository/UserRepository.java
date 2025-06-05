package com.secureops.repository;

import com.secureops.entity.User;
import com.secureops.entity.User.ApprovalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByApprovalStatus(ApprovalStatus approvalStatus);

    @Query("SELECT u FROM User u WHERE u.isActive = :isActive AND u.approvalStatus = :approvalStatus")
    List<User> findByActiveAndApprovalStatus(@Param("isActive") boolean isActive,
            @Param("approvalStatus") ApprovalStatus approvalStatus);
}