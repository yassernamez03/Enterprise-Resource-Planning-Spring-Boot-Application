package com.secureops.dto;

import com.secureops.entity.TaskEvent;
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
public class TaskEventDto {
    
    private Long id;
    
    @NotEmpty(message = "Title cannot be empty")
    private String title;
    
    private String description;
    
    @NotNull(message = "Status cannot be null")
    private TaskEvent.TaskEventStatus status;
    
    @NotNull(message = "Type cannot be null")
    private TaskEvent.TaskEventType type;
    
    private Date startTime;
    private Date dueDate;
    private String location;
    private boolean isGlobal;
    private Date completedDate;
    
    // // Event specific fields
    // private boolean allDay;
    // private String recurrencePattern;
    // private String color;
    
    // // Task specific fields
    // private String priority;
    
    private Set<Long> assignedUserIds;
}