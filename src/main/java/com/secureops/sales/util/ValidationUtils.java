package com.secureops.sales.util;

import com.secureops.sales.exception.BusinessException;

import java.math.BigDecimal;
import java.util.Collection;

/**
 * Utility class for validation operations
 */
public class ValidationUtils {

    private ValidationUtils() {
        // Private constructor to prevent instantiation
    }

    /**
     * Validates that the object is not null
     * @throws BusinessException if the object is null
     */
    public static void notNull(Object object, String message) {
        if (object == null) {
            throw new BusinessException(message);
        }
    }

    /**
     * Validates that the string is not null or empty
     * @throws BusinessException if the string is null or empty
     */
    public static void notEmpty(String string, String message) {
        if (StringUtils.isEmpty(string)) {
            throw new BusinessException(message);
        }
    }

    /**
     * Validates that the collection is not null or empty
     * @throws BusinessException if the collection is null or empty
     */
    public static void notEmpty(Collection<?> collection, String message) {
        if (collection == null || collection.isEmpty()) {
            throw new BusinessException(message);
        }
    }

    /**
     * Validates that the condition is true
     * @throws BusinessException if the condition is false
     */
    public static void isTrue(boolean condition, String message) {
        if (!condition) {
            throw new BusinessException(message);
        }
    }

    /**
     * Validates that the value is greater than zero
     * @throws BusinessException if the value is null or less than or equal to zero
     */
    public static void greaterThanZero(BigDecimal value, String message) {
        notNull(value, message);
        if (value.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(message);
        }
    }

    /**
     * Validates that the value is greater than or equal to zero
     * @throws BusinessException if the value is null or less than zero
     */
    public static void greaterThanOrEqualToZero(BigDecimal value, String message) {
        notNull(value, message);
        if (value.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException(message);
        }
    }

    /**
     * Validates that the value is greater than zero
     * @throws BusinessException if the value is less than or equal to zero
     */
    public static void greaterThanZero(Integer value, String message) {
        notNull(value, message);
        if (value <= 0) {
            throw new BusinessException(message);
        }
    }

    /**
     * Validates that the value is greater than or equal to zero
     * @throws BusinessException if the value is less than zero
     */
    public static void greaterThanOrEqualToZero(Integer value, String message) {
        notNull(value, message);
        if (value < 0) {
            throw new BusinessException(message);
        }
    }

    /**
     * Validates that the string is a valid email address
     * @throws BusinessException if the string is not a valid email address
     */
    public static void validEmail(String email, String message) {
        if (!StringUtils.isValidEmail(email)) {
            throw new BusinessException(message);
        }
    }

    /**
     * Validates that the string is a valid phone number
     * @throws BusinessException if the string is not a valid phone number
     */
    public static void validPhone(String phone, String message) {
        if (!StringUtils.isValidPhone(phone)) {
            throw new BusinessException(message);
        }
    }
}