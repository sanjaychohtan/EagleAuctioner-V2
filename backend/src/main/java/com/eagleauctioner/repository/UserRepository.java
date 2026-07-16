package com.eagleauctioner.repository;

import com.eagleauctioner.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    
    @EntityGraph(attributePaths = {"roles", "roles.permissions"})
    Optional<User> findByEmailIgnoreCase(String email);

    @EntityGraph(attributePaths = {"roles", "roles.permissions"})
    Optional<User> findByEmailIgnoreCaseAndDeletedAtIsNull(String email);

    Optional<User> findByEmail(String email);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCaseAndDeletedAtIsNull(String email);
}
