package com.secureops.hr.repository;

import com.secureops.hr.entity.HRTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface HRTaskRepository extends JpaRepository<HRTask, Long> {
    List<HRTask> findByEmployeeId(Long employeeId);
    List<HRTask> findByStatus(String status);
    List<HRTask> findByDueDateBefore(LocalDate date);
}