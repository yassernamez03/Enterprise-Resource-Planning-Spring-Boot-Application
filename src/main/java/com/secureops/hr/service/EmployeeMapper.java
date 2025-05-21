package com.secureops.hr.service;


import com.secureops.entity.User;
import com.secureops.hr.dto.EmployeeDTO;
import com.secureops.hr.entity.Address;
import com.secureops.hr.entity.Employee;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class EmployeeMapper {

    private final AddressMapper addressMapper;
    private final HRTaskMapper taskMapper;

    @Autowired
    public EmployeeMapper(AddressMapper addressMapper, HRTaskMapper taskMapper) {
        this.addressMapper = addressMapper;
        this.taskMapper = taskMapper;
    }

    public EmployeeDTO toDto(Employee employee) {
        if (employee == null) {
            return null;
        }

        EmployeeDTO dto = new EmployeeDTO();
        dto.setId(employee.getId());
        dto.setFirstName(employee.getFirstName());
        dto.setLastName(employee.getLastName());
        dto.setEmail(employee.getEmail());
        dto.setPhone(employee.getPhone());
        dto.setDateOfBirth(employee.getDateOfBirth());
        dto.setHireDate(employee.getHireDate());
        dto.setPosition(employee.getPosition());
        dto.setSalary(employee.getSalary());
        dto.setStatus(employee.getStatus());
        dto.setRole(employee.getRole());
        dto.setAge(employee.getAge());


        if (employee.getAddress() != null) {
            dto.setAddress(addressMapper.toDto(employee.getAddress()));
        }

        if (employee.getTasks() != null) {
            dto.setTasks(employee.getTasks().stream()
                    .map(taskMapper::toDto)
                    .collect(Collectors.toList()));
        }

        // Bullshit
        if (employee.getUser() != null) {
            dto.setUserId(employee.getUser().getId());
        }
        // End of the bullshit

        return dto;
    }

    public Employee toEntity(EmployeeDTO dto) {
        if (dto == null) {
            return null;
        }

        Employee employee = new Employee();
        employee.setId(dto.getId());
        employee.setFirstName(dto.getFirstName());
        employee.setLastName(dto.getLastName());
        employee.setEmail(dto.getEmail());
        employee.setPhone(dto.getPhone());
        employee.setDateOfBirth(dto.getDateOfBirth());
        employee.setHireDate(dto.getHireDate());
        employee.setPosition(dto.getPosition());
        employee.setSalary(dto.getSalary());
        employee.setStatus(dto.getStatus());
        employee.setRole(dto.getRole());

        if (dto.getAddress() != null) {
            employee.setAddress(addressMapper.toEntity(dto.getAddress()));
        }

        // Bullshit
        if (dto.getUserId() != null) {
            User user = new User();
            user.setId(dto.getUserId());
            employee.setUser(user);
        }
        // End of the bullshit

        return employee;
    }

    public Employee updateEntityFromDto(EmployeeDTO dto, Employee employee) {
        if (dto == null) {
            return employee;
        }

        // Only update fields that are not null
        if (dto.getFirstName() != null) {
            employee.setFirstName(dto.getFirstName());
        }
        if (dto.getLastName() != null) {
            employee.setLastName(dto.getLastName());
        }
        if (dto.getEmail() != null) {
            employee.setEmail(dto.getEmail());
        }
        if (dto.getPhone() != null) {
            employee.setPhone(dto.getPhone());
        }
        if (dto.getDateOfBirth() != null) {
            employee.setDateOfBirth(dto.getDateOfBirth());
        }
        if (dto.getHireDate() != null) {
            employee.setHireDate(dto.getHireDate());
        }
        if (dto.getPosition() != null) {
            employee.setPosition(dto.getPosition());
        }
        if (dto.getSalary() != null) {
            employee.setSalary(dto.getSalary());
        }
        if (dto.getStatus() != null) {
            employee.setStatus(dto.getStatus());
        }
        if (dto.getRole() != null) {
            employee.setRole(dto.getRole());
        }

        if (dto.getAddress() != null) {
            if (employee.getAddress() == null) {
                employee.setAddress(addressMapper.toEntity(dto.getAddress()));
            } else {
                Address address = employee.getAddress();
                addressMapper.updateEntityFromDto(dto.getAddress(), address);
            }
        }

        // Bullshit
        if (dto.getUserId() != null) {
            if (employee.getUser() == null) {
                User user = new User();
                user.setId(dto.getUserId());
                employee.setUser(user);
            } else {
                employee.getUser().setId(dto.getUserId());
            }
        }
        // End of the bullshit

        return employee;
    }
}