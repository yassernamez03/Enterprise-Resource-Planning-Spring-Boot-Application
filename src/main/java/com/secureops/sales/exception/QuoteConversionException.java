package com.secureops.sales.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class QuoteConversionException extends BusinessException {

    public QuoteConversionException(String message) {
        super(message);
    }

    public QuoteConversionException(String message, Throwable cause) {
        super(message, cause);
    }
}