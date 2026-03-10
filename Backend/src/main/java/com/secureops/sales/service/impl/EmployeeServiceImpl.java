package com.secureops.sales.service.impl;

import com.secureops.sales.entity.Employee;
import com.secureops.sales.exception.ResourceNotFoundException;
import com.secureops.sales.repository.SalesEmployeeRepository;
import com.secureops.sales.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EmployeeServiceImpl implements EmployeeService {

    private final SalesEmployeeRepository salesEmployeeRepository;

    @Override
    public List<Employee> getAllEmployees() {
        return salesEmployeeRepository.findAll();
    }

    @Override
    public Employee getEmployeeById(Long id) {
        return salesEmployeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", id));
    }

    @Override
    public Employee getEmployeeByEmail(String email) {
        return salesEmployeeRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "email", email));
    }

    @Override
    public List<Employee> getActiveEmployees() {
        return salesEmployeeRepository.findByActiveTrue();
    }
}