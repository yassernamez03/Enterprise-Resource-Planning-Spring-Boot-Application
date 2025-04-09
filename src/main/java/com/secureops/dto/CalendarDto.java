package com.secureops.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CalendarDto {
    private Long id;
    
    @NotEmpty(message = "Calendar name is required")
    private String name;
    
    private String color;
    private boolean isPrimary;
}