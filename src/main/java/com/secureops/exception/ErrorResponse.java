package com.secureops.exception;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse {
    private Date timestamp;
    private String message;
    private String details;
    
    public ErrorResponse(String message, String details) {
        this.timestamp = new Date();
        this.message = message;
        this.details = details;
    }
}