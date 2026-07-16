package com.eagleauctioner.repository;

import com.eagleauctioner.entity.WinnerHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WinnerHistoryRepository extends JpaRepository<WinnerHistory, UUID> {

    @Query("SELECT DISTINCT wh FROM WinnerHistory wh JOIN FETCH wh.winner w WHERE w.id = :winnerId ORDER BY wh.actionAt DESC")
    List<WinnerHistory> findByWinnerIdOrderByActionAtDesc(@Param("winnerId") UUID winnerId);
}
