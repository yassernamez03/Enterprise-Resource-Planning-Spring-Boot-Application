package com.secureops.hr.dto;

import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HRTaskDTO {
    private Long id;
    private String title;
    private String description;
    private LocalDate dueDate;
    private LocalDate completedDate;
    private String status;
    private Integer priority;
    private Long employeeId;

}
