package com.secureops.hr.service;

import com.secureops.hr.dto.EmployeeDTO;
import com.secureops.hr.entity.Employee;
import com.secureops.hr.entity.EmployeeStatus;
import com.secureops.hr.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final EmployeeMapper employeeMapper;

    @Autowired
    public EmployeeService(EmployeeRepository employeeRepository, EmployeeMapper employeeMapper) {
        this.employeeRepository = employeeRepository;
        this.employeeMapper = employeeMapper;
    }

    /**
     * Creates a new employee.
     *
     * @param employeeDTO the employee data transfer object
     * @return the created employee data transfer object
     */
    @Transactional
    public EmployeeDTO createEmployee(EmployeeDTO employeeDTO) {
        Employee employee = employeeMapper.toEntity(employeeDTO);
        Employee savedEmployee = employeeRepository.save(employee);
        return employeeMapper.toDto(savedEmployee);
    }

    /**
     * Updates an existing employee.
     *
     * @param id          the ID of the employee to update
     * @param employeeDTO the updated employee data transfer object
     * @return the updated employee data transfer object
     */
    @Transactional
    public EmployeeDTO updateEmployee(Long id, EmployeeDTO employeeDTO) {
        Employee existingEmployee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + id));

        // Update employee properties
        Employee updatedEmployee = employeeMapper.updateEntityFromDto(employeeDTO, existingEmployee);
        Employee savedEmployee = employeeRepository.save(updatedEmployee);

        return employeeMapper.toDto(savedEmployee);
    }

    /**
     * Retrieves all employees.
     *
     * @return a list of employee data transfer objects
     */
    public List<EmployeeDTO> getAllEmployees() {
        List<Employee> employees = employeeRepository.findAll();
        return employees.stream()
                .map(employeeMapper::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves an employee by ID.
     *
     * @param id the ID of the employee to retrieve
     * @return the employee data transfer object
     */
    public EmployeeDTO getEmployeeById(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + id));
        return employeeMapper.toDto(employee);
    }

    /**
     * Deletes an employee by ID.
     *
     * @param id the ID of the employee to delete
     */
    @Transactional
    public void deleteEmployee(Long id) {
        if (!employeeRepository.existsById(id)) {
            throw new RuntimeException("Employee not found with id: " + id);
        }
        employeeRepository.deleteById(id);
    }

    /**
     * Retrieves employees by status.
     *
     * @param status the status of the employees to retrieve
     * @return a list of employee data transfer objects
     */
    public List<EmployeeDTO> getEmployeesByStatus(EmployeeStatus status) {
        List<Employee> employees = employeeRepository.findByStatus(status);
        return employees.stream()
                .map(employeeMapper::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves employees by role.
     *
     * @param role the role of the employees to retrieve
     * @return a list of employee data transfer objects
     */
    public List<EmployeeDTO> getEmployeesByRole(String role) {
        List<Employee> employees = employeeRepository.findByRole(role);
        return employees.stream()
                .map(employeeMapper::toDto)
                .collect(Collectors.toList());
    }

    // bullshit method to get employee by id
    public EmployeeDTO getEmployeeByUserId(Long userId) {
        Employee employee = employeeRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Employee not found for user id: " + userId));
        return employeeMapper.toDto(employee);
    }
    // end of bullshit
}