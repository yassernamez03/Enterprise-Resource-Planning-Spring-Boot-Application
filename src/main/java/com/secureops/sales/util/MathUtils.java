package com.secureops.sales.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Utility class for mathematical operations related to pricing and calculations
 */
public class MathUtils {

    private MathUtils() {
        // Private constructor to prevent instantiation
    }

    /**
     * Default scale for BigDecimal operations
     */
    public static final int DEFAULT_SCALE = 2;

    /**
     * Default rounding mode for BigDecimal operations
     */
    public static final RoundingMode DEFAULT_ROUNDING_MODE = RoundingMode.HALF_UP;

    /**
     * Rounds a BigDecimal to 2 decimal places using HALF_UP rounding
     */
    public static BigDecimal round(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        return value.setScale(DEFAULT_SCALE, DEFAULT_ROUNDING_MODE);
    }

    /**
     * Adds two BigDecimals safely, handling null values
     */
    public static BigDecimal add(BigDecimal a, BigDecimal b) {
        if (a == null) {
            return b == null ? BigDecimal.ZERO : b;
        }
        if (b == null) {
            return a;
        }
        return a.add(b);
    }

    /**
     * Subtracts second BigDecimal from first BigDecimal safely, handling null values
     */
    public static BigDecimal subtract(BigDecimal a, BigDecimal b) {
        if (a == null) {
            return b == null ? BigDecimal.ZERO : b.negate();
        }
        if (b == null) {
            return a;
        }
        return a.subtract(b);
    }

    /**
     * Multiplies two BigDecimals safely, handling null values
     */
    public static BigDecimal multiply(BigDecimal a, BigDecimal b) {
        if (a == null || b == null) {
            return BigDecimal.ZERO;
        }
        return a.multiply(b);
    }

    /**
     * Multiplies a BigDecimal by an integer safely, handling null values
     */
    public static BigDecimal multiply(BigDecimal a, int b) {
        if (a == null) {
            return BigDecimal.ZERO;
        }
        return a.multiply(new BigDecimal(b));
    }

    /**
     * Calculates a percentage of a value
     */
    public static BigDecimal percentage(BigDecimal value, BigDecimal percentage) {
        if (value == null || percentage == null) {
            return BigDecimal.ZERO;
        }
        return multiply(value, percentage).divide(new BigDecimal("100"), DEFAULT_SCALE, DEFAULT_ROUNDING_MODE);
    }

    /**
     * Divides first BigDecimal by second BigDecimal safely, handling null values and division by zero
     */
    public static BigDecimal divide(BigDecimal a, BigDecimal b) {
        if (a == null) {
            return BigDecimal.ZERO;
        }
        if (b == null || b.compareTo(BigDecimal.ZERO) == 0) {
            throw new ArithmeticException("Division by zero");
        }
        return a.divide(b, DEFAULT_SCALE, DEFAULT_ROUNDING_MODE);
    }
}