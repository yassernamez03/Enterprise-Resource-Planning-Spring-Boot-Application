package com.secureops.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EventDto {
    private Long id;
    
    @NotEmpty(message = "Event title is required")
    private String title;
    
    private String description;
    
    @NotNull(message = "Start time is required")
    private Date startTime;
    
    @NotNull(message = "End time is required")
    private Date endTime;
    
    private boolean allDay;
    private String location;
    private String recurrencePattern;
    private Long calendarId;
}