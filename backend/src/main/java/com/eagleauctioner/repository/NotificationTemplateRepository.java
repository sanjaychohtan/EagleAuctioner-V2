package com.eagleauctioner.repository;

import com.eagleauctioner.entity.NotificationTemplate;
import com.eagleauctioner.enums.NotificationChannel;
import com.eagleauctioner.enums.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationTemplateRepository extends JpaRepository<NotificationTemplate, UUID> {
    
    @Query("SELECT t FROM NotificationTemplate t WHERE t.name = :name AND t.isActive = true " +
           "AND (t.effectiveFrom IS NULL OR t.effectiveFrom <= :now) " +
           "AND (t.effectiveTo IS NULL OR t.effectiveTo > :now) " +
           "ORDER BY t.templateVersion DESC")
    List<NotificationTemplate> findActiveByName(@Param("name") String name, @Param("now") Instant now);

    default Optional<NotificationTemplate> findByNameAndIsActiveTrue(String name) {
        List<NotificationTemplate> templates = findActiveByName(name, Instant.now());
        return templates.isEmpty() ? Optional.empty() : Optional.of(templates.get(0));
    }

    @Query("SELECT t FROM NotificationTemplate t WHERE t.notificationType = :type AND t.channel = :channel AND t.isActive = true " +
           "AND (t.effectiveFrom IS NULL OR t.effectiveFrom <= :now) " +
           "AND (t.effectiveTo IS NULL OR t.effectiveTo > :now) " +
           "ORDER BY t.templateVersion DESC")
    List<NotificationTemplate> findActiveByTypeAndChannel(@Param("type") NotificationType type, @Param("channel") NotificationChannel channel, @Param("now") Instant now);

    default Optional<NotificationTemplate> findByNotificationTypeAndChannelAndIsActiveTrue(NotificationType type, NotificationChannel channel) {
        List<NotificationTemplate> templates = findActiveByTypeAndChannel(type, channel, Instant.now());
        return templates.isEmpty() ? Optional.empty() : Optional.of(templates.get(0));
    }
    
    Optional<NotificationTemplate> findByNameAndTemplateVersion(String name, int templateVersion);
}
