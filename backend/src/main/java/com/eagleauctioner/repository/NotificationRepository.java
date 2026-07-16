package com.eagleauctioner.repository;

import com.eagleauctioner.entity.Notification;
import com.eagleauctioner.enums.NotificationChannel;
import com.eagleauctioner.enums.NotificationStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID userId);
    
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.userId = :userId AND n.readAt IS NULL AND n.deletedAt IS NULL")
    long countUnreadNotifications(@Param("userId") UUID userId);

    @Query("SELECT n FROM Notification n WHERE n.userId = :userId AND n.deletedAt IS NULL " +
           "AND (:channel IS NULL OR n.channel = :channel) " +
           "AND (:status IS NULL OR n.status = :status) " +
           "ORDER BY n.createdAt DESC")
    List<Notification> searchNotifications(@Param("userId") UUID userId, 
                                          @Param("channel") NotificationChannel channel, 
                                          @Param("status") NotificationStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT n FROM Notification n WHERE n.id = :id")
    Optional<Notification> findByIdForUpdate(@Param("id") UUID id);
}
