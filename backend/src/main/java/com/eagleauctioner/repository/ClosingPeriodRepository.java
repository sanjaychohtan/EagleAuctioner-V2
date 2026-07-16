package com.eagleauctioner.repository;

import com.eagleauctioner.entity.ClosingPeriod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClosingPeriodRepository extends JpaRepository<ClosingPeriod, UUID> {
    
    @Query("SELECT p FROM ClosingPeriod p WHERE :date BETWEEN p.startDate AND p.endDate AND p.status = 'CLOSED'")
    Optional<ClosingPeriod> findClosedPeriodForDate(@Param("date") LocalDate date);

    Optional<ClosingPeriod> findByPeriodYearAndPeriodMonth(Integer periodYear, Integer periodMonth);
}
