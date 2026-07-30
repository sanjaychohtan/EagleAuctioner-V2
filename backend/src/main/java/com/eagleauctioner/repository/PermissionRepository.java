package com.eagleauctioner.repository;

import com.eagleauctioner.entity.Permission;
import com.eagleauctioner.enums.Module;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, UUID> {
    Optional<Permission> findByName(String name);
    Optional<Permission> findByActionKey(String actionKey);
    List<Permission> findByModule(Module module);
}
