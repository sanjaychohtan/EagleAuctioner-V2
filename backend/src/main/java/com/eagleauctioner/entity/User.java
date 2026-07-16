package com.eagleauctioner.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.eagleauctioner.enums.UserType;

import java.time.Instant;
import java.util.Collection;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_users_user_type", columnList = "user_type"),
    @Index(name = "idx_users_active", columnList = "is_active"),
    @Index(name = "idx_users_locked", columnList = "is_locked")
})
@SQLDelete(sql = "UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 100)
    @Size(max = 100)
    private String email;

    @JsonIgnore
    @Column(name = "password_hash", nullable = false)
    @Size(min = 60, max = 255)
    private String password;

    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    @Column(name = "mobile", length = 15)
    @Pattern(regexp = "^[0-9]{10,15}$")
    private String mobile;

    @Enumerated(EnumType.STRING)
    @Column(name = "user_type", nullable = false)
    private UserType userType;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Builder.Default
    @Column(name = "is_locked", nullable = false)
    private boolean isLocked = false;

    @Builder.Default
    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified = false;

    @Builder.Default
    @Column(name = "mobile_verified", nullable = false)
    private boolean mobileVerified = false;

    @Builder.Default
    @Column(name = "failed_login_attempts")
    private int failedLoginAttempts = 0;

    @Column(name = "locked_at")
    private Instant lockedAt;

    @Column(name = "password_expires_at")
    private Instant passwordExpiresAt;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @Column(name = "last_password_change_at")
    private Instant lastPasswordChangeAt;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    @Builder.Default
    private Set<Role> roles = new HashSet<>();

    @Version
    private Long version;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "updated_by")
    private String updatedBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @PrePersist
    @PreUpdate
    public void normalizeData() {
        if (email != null) {
            email = email.trim().toLowerCase();
        }
        if (mobile != null) {
            mobile = mobile.trim();
        }
    }

    @Override
    public String getPassword() {
        return this.password;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        Set<GrantedAuthority> authorities = new HashSet<>();
        if (roles != null) {
            for (Role role : roles) {
                authorities.add(new SimpleGrantedAuthority("ROLE_" + role.getName()));
                if (role.getPermissions() != null) {
                    authorities.addAll(role.getPermissions().stream()
                        .map(p -> new SimpleGrantedAuthority(p.getName()))
                        .collect(Collectors.toSet()));
                }
            }
        }
        return authorities;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return !isLocked;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return passwordExpiresAt == null || Instant.now().isBefore(passwordExpiresAt);
    }

    @Override
    public boolean isEnabled() {
        return isActive && deletedAt == null;
    }
}
