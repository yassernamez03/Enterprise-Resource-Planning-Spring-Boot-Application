package com.secureops.sales.exception;

import com.secureops.sales.dto.response.ErrorResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import org.springframework.web.context.request.ServletWebRequest;
@ControllerAdvice
@Component("salesGlobalExceptionHandler")
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFoundException(
            ResourceNotFoundException ex, WebRequest request) {

        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.NOT_FOUND, ex.getMessage(), path);

        return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusinessException(
            BusinessException ex, WebRequest request) {

        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.BAD_REQUEST, ex.getMessage(), path);

        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex,
            HttpHeaders headers,
            HttpStatus status,
            WebRequest request) {

        StringBuilder messageBuilder = new StringBuilder("Validation failed: ");
        ex.getBindingResult().getFieldErrors().forEach(error ->
                messageBuilder.append(error.getField())
                        .append(": ")
                        .append(error.getDefaultMessage())
                        .append("; ")
        );

        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.BAD_REQUEST, messageBuilder.toString(), path);

        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleAllExceptions(
            Exception ex, WebRequest request) {

        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred: " + ex.getMessage(),
                path);

        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
