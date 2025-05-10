package com.secureops.hr.dto;

import com.secureops.hr.entity.EmployeeStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeDTO {

    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private LocalDate dateOfBirth;
    private LocalDate hireDate;
    private String position;
    private Double salary;
    private Integer age;
    private EmployeeStatus status;
    private AddressDTO address;
    private List<HRTaskDTO> tasks = new ArrayList<>();
    private String role;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}
