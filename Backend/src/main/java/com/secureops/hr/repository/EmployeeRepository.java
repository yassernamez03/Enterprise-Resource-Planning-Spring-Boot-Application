package com.secureops.hr.repository;

import com.secureops.hr.entity.Employee;
import com.secureops.hr.entity.EmployeeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    List<Employee> findByStatus(EmployeeStatus status);
    List<Employee> findByRole(String role);
    Employee findByEmail(String email);

    // Bullshit method to find employee by userId
    Optional<Employee> findByUserId(Long userId);
    // End of bullshit
}