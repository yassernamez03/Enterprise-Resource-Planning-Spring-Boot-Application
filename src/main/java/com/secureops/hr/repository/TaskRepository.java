package com.secureops.hr.repository;

import com.secureops.hr.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByEmployeeId(Long employeeId);
    List<Task> findByStatus(String status);
    List<Task> findByDueDateBefore(LocalDate date);
}