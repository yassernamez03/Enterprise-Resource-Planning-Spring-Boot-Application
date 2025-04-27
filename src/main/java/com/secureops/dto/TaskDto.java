package com.secureops.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskDto {
    
    private Long id;
    
    @NotEmpty(message = "Task title cannot be empty")
    private String title;
    
    private String description;
    
    @NotNull(message = "Due date cannot be null")
    private Date dueDate;
    
    private boolean completed;
    
    private String priority;
    
    private String color;
    
    private boolean isGlobal;
    
    private Set<Long> assignedUserIds;
}
