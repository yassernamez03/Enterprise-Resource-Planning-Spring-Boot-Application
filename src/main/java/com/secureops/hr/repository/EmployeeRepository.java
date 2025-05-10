package com.secureops.hr.repository;

import com.secureops.hr.entity.Employee;
import com.secureops.hr.entity.EmployeeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    List<Employee> findByStatus(EmployeeStatus status);
    List<Employee> findByRole(String role);
    Employee findByEmail(String email);
}