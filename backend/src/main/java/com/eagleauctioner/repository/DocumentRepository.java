package com.eagleauctioner.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.NoRepositoryBean;
import java.util.UUID;

/**
 * Generic base repository for commercial documents.
 */
@NoRepositoryBean
public interface DocumentRepository<T> extends JpaRepository<T, UUID> {
}
