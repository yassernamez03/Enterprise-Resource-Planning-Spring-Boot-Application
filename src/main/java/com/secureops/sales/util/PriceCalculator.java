package com.secureops.sales.util;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;

public class PriceCalculator {

    private static final BigDecimal VAT_RATE = new BigDecimal("0.20"); // 20% VAT
    private static final int SCALE = 2;
    private static final RoundingMode ROUNDING_MODE = RoundingMode.HALF_UP;

    public static BigDecimal calculateSubtotal(BigDecimal unitPrice, int quantity) {
        return unitPrice.multiply(BigDecimal.valueOf(quantity))
                .setScale(SCALE, ROUNDING_MODE);
    }

    public static BigDecimal calculateVAT(BigDecimal subtotal) {
        return subtotal.multiply(VAT_RATE)
                .setScale(SCALE, ROUNDING_MODE);
    }

    public static BigDecimal calculateTotal(BigDecimal subtotal) {
        return subtotal.add(calculateVAT(subtotal))
                .setScale(SCALE, ROUNDING_MODE);
    }

    /**
     * Apply discount percentage to price
     */
    public static BigDecimal applyDiscount(BigDecimal price, BigDecimal discountPercentage) {
        if (discountPercentage == null || discountPercentage.compareTo(BigDecimal.ZERO) <= 0) {
            return price;
        }

        BigDecimal discountFactor = BigDecimal.ONE.subtract(
                discountPercentage.divide(new BigDecimal("100"), SCALE, ROUNDING_MODE));

        return price.multiply(discountFactor)
                .setScale(SCALE, ROUNDING_MODE);
    }

    /**
     * Calculate total for a list of item prices
     */
    public static <T> BigDecimal calculateListTotal(List<T> items, java.util.function.Function<T, BigDecimal> priceExtractor) {
        return items.stream()
                .map(priceExtractor)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(SCALE, ROUNDING_MODE);
    }

    /**
     * Apply quantity discounts based on a discount table
     * Map key is minimum quantity, value is discount percentage
     */
    public static BigDecimal applyQuantityDiscount(BigDecimal unitPrice, int quantity,
                                                   Map<Integer, BigDecimal> discountTable) {
        BigDecimal applicableDiscount = BigDecimal.ZERO;

        for (Map.Entry<Integer, BigDecimal> entry : discountTable.entrySet()) {
            if (quantity >= entry.getKey() && entry.getValue().compareTo(applicableDiscount) > 0) {
                applicableDiscount = entry.getValue();
            }
        }

        return applyDiscount(unitPrice, applicableDiscount);
    }
}