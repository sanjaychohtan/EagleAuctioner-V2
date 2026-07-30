package com.eagleauctioner.repository;

import com.eagleauctioner.entity.DelegatedApproval;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface DelegatedApprovalRepository extends JpaRepository<DelegatedApproval, UUID> {
    List<DelegatedApproval> findByDelegateeIdAndIsActiveTrueAndStartTimeBeforeAndEndTimeAfter(
            UUID delegateeId, Instant now1, Instant now2
    );
}
