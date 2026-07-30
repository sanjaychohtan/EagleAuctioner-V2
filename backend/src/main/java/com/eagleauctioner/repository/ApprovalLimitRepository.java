package com.eagleauctioner.repository;

import com.eagleauctioner.entity.ApprovalLimit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ApprovalLimitRepository extends JpaRepository<ApprovalLimit, UUID> {
    Optional<ApprovalLimit> findByUserIdAndModule(UUID userId, String module);
    List<ApprovalLimit> findByRoleId(UUID roleId);
}
