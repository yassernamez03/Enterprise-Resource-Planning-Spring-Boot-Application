package com.secureops.repository;

import com.secureops.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByCreatedById(Long createdById);
    
    // Find all tasks assigned to a specific user
    @Query("SELECT t FROM Task t JOIN t.assignedUsers u WHERE u.id = :userId")
    List<Task> findByAssignedUserId(Long userId);
    
    // Find all tasks assigned to a specific user in date range
    @Query("SELECT t FROM Task t JOIN t.assignedUsers u WHERE u.id = :userId AND t.dueDate >= :start AND t.dueDate <= :end")
    List<Task> findByAssignedUserIdAndDateRange(Long userId, Date start, Date end);
    
    // Find all global tasks
    List<Task> findByIsGlobalTrue();
    
    // Find all global tasks in date range
    List<Task> findByIsGlobalTrueAndDueDateBetween(Date start, Date end);
    
    // Find all tasks visible to a user (either global or assigned to them)
    @Query("SELECT t FROM Task t WHERE t.isGlobal = true OR EXISTS (SELECT u FROM t.assignedUsers u WHERE u.id = :userId)")
    List<Task> findAllVisibleTasks(Long userId);
    
    // Find all tasks visible to a user within a date range
    @Query("SELECT t FROM Task t WHERE (t.isGlobal = true OR EXISTS (SELECT u FROM t.assignedUsers u WHERE u.id = :userId)) AND t.dueDate >= :start AND t.dueDate <= :end")
    List<Task> findAllVisibleTasksBetween(Long userId, Date start, Date end);
    
    // Find all tasks (for admin)
    List<Task> findByDueDateBetween(Date start, Date end);
}