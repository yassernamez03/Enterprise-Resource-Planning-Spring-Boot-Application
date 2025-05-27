package com.secureops.hr.controller;


import com.secureops.hr.dto.EmployeeDTO;
import com.secureops.hr.entity.EmployeeStatus;
import com.secureops.hr.service.EmployeeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hr/employees")
public class EmployeeController {

    private final EmployeeService employeeService;

    @Autowired
    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @PostMapping("/create")
    public ResponseEntity<EmployeeDTO> createEmployee(@RequestBody EmployeeDTO employeeDTO) {
        EmployeeDTO createdEmployee = employeeService.createEmployee(employeeDTO);
        return new ResponseEntity<>(createdEmployee, HttpStatus.CREATED);
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<EmployeeDTO> updateEmployee(
            @PathVariable Long id,
            @RequestBody EmployeeDTO employeeDTO) {
        EmployeeDTO updatedEmployee = employeeService.updateEmployee(id, employeeDTO);
        return ResponseEntity.ok(updatedEmployee);
    }

    @GetMapping
    public ResponseEntity<List<EmployeeDTO>> getAllEmployees() {
        List<EmployeeDTO> employees = employeeService.getAllEmployees();
        return ResponseEntity.ok(employees);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployeeDTO> getEmployeeById(@PathVariable Long id) {
        EmployeeDTO employee = employeeService.getEmployeeById(id);
        return ResponseEntity.ok(employee);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteEmployee(@PathVariable Long id) {
        employeeService.deleteEmployee(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<EmployeeDTO>> getEmployeesByStatus(
            @PathVariable EmployeeStatus status) {
        List<EmployeeDTO> employees = employeeService.getEmployeesByStatus(status);
        return ResponseEntity.ok(employees);
    }

    @GetMapping("/role/{role}")
    public ResponseEntity<List<EmployeeDTO>> getEmployeesByRole(
            @PathVariable String role) {
        List<EmployeeDTO> employees = employeeService.getEmployeesByRole(role);
        return ResponseEntity.ok(employees);
    }

    // Bullshit method to find employee by userId
    @GetMapping("/user/{userId}")
    public ResponseEntity<EmployeeDTO> getEmployeeByUserId(@PathVariable Long userId) {
        EmployeeDTO employee = employeeService.getEmployeeByUserId(userId);
        return ResponseEntity.ok(employee);
    }
    // End of bullshit
}