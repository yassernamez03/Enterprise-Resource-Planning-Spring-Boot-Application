package com.secureops.sales.service;

import com.secureops.sales.entity.Employee;
import java.util.List;

public interface EmployeeService {
    List<Employee> getAllEmployees();
    Employee getEmployeeById(Long id);
    Employee getEmployeeByEmail(String email);
    List<Employee> getActiveEmployees();
}