package com.eagleauctioner.repository;

import com.eagleauctioner.entity.OutboxEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import java.time.Instant;

import java.util.List;
import java.util.UUID;

@Repository
public interface OutboxEventRepository extends JpaRepository<OutboxEvent, UUID> {
    List<OutboxEvent> findByProcessedFalseOrderByCreatedAtAsc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints({@QueryHint(name = "jakarta.persistence.lock.timeout", value = "-2")})
    @Query("SELECT e FROM OutboxEvent e WHERE e.processed = false AND e.status IN ('PENDING', 'FAILED') AND (e.nextRetryTime IS NULL OR e.nextRetryTime <= :now) ORDER BY e.createdAt ASC")
    List<OutboxEvent> findEventsToProcess(@Param("now") Instant now);
}
