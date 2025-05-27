package com.secureops.hr.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Data
@Table(name = "tasks")
@NoArgsConstructor
@AllArgsConstructor
public class HRTask {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String description;
    private LocalDate dueDate;
    private LocalDate completedDate;
    private String status; // PENDING, IN_PROGRESS, COMPLETED, DELAYED
    private Integer priority; // 1-5

    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;

}
