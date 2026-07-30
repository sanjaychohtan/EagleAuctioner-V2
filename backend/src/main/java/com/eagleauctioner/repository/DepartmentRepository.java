package com.eagleauctioner.repository;

import com.eagleauctioner.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, UUID> {
    Optional<Department> findByCode(String code);
    List<Department> findByParentIdIsNull();
    List<Department> findByParentId(UUID parentId);
}
