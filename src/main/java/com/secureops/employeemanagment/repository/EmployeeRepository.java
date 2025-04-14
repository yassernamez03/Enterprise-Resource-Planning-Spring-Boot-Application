package com.secureops.employeemanagment.repository;

import com.secureops.employeemanagment.model.Employee;
import com.secureops.employeemanagment.model.EmployeeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    List<Employee> findByStatus(EmployeeStatus status);
    List<Employee> findByRole(String role);
    Employee findByEmail(String email);
}