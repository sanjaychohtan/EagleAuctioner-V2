package com.eagleauctioner.repository;

import com.eagleauctioner.entity.DataScope;
import com.eagleauctioner.enums.DataScopeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DataScopeRepository extends JpaRepository<DataScope, UUID> {
    List<DataScope> findByUserId(UUID userId);
    List<DataScope> findByRoleId(UUID roleId);
    List<DataScope> findByUserIdAndScopeType(UUID userId, DataScopeType scopeType);
}
