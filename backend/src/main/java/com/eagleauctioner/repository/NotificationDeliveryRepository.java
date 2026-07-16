package com.eagleauctioner.repository;

import com.eagleauctioner.entity.NotificationDelivery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationDeliveryRepository extends JpaRepository<NotificationDelivery, UUID> {
    List<NotificationDelivery> findByNotificationId(UUID notificationId);

    @Query("SELECT d FROM NotificationDelivery d WHERE d.status = 'RETRYING' AND d.nextRetryAt <= :now")
    List<NotificationDelivery> findDeliveriesToRetry(@Param("now") Instant now);

    Optional<NotificationDelivery> findFirstByNotificationIdOrderByCreatedAtDesc(UUID notificationId);
}
