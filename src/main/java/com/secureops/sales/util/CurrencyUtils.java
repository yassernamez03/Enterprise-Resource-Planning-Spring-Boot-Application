package com.secureops.sales.util;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.util.Currency;
import java.util.Locale;

/**
 * Utility class for currency and money-related operations.
 */
public class CurrencyUtils {

    private static final Currency DEFAULT_CURRENCY = Currency.getInstance("MAD"); // Moroccan Dirham
    private static final Locale MOROCCO_LOCALE = new Locale("fr", "MA");
    private static final int DEFAULT_SCALE = 2;

    private CurrencyUtils() {
        // Private constructor to prevent instantiation
    }

    /**
     * Format an amount with the default currency symbol (MAD)
     * @param amount the amount to format
     * @return formatted currency string (e.g., "1,234.56 MAD")
     */
    public static String formatCurrency(BigDecimal amount) {
        if (amount == null) {
            return "";
        }

        NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(MOROCCO_LOCALE);
        currencyFormat.setCurrency(DEFAULT_CURRENCY);
        return currencyFormat.format(amount);
    }

    /**
     * Format an amount with a specific currency
     * @param amount the amount to format
     * @param currencyCode the ISO 4217 currency code (e.g., "USD", "EUR")
     * @return formatted currency string
     */
    public static String formatCurrency(BigDecimal amount, String currencyCode) {
        if (amount == null) {
            return "";
        }

        try {
            Currency currency = Currency.getInstance(currencyCode);
            NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(Locale.getDefault());
            currencyFormat.setCurrency(currency);
            return currencyFormat.format(amount);
        } catch (IllegalArgumentException e) {
            // Fallback to default currency if the provided code is invalid
            return formatCurrency(amount);
        }
    }

    /**
     * Rounds the amount to 2 decimal places using the default financial rounding mode (HALF_UP)
     * @param amount the amount to round
     * @return rounded amount
     */
    public static BigDecimal roundAmount(BigDecimal amount) {
        if (amount == null) {
            return BigDecimal.ZERO;
        }
        return amount.setScale(DEFAULT_SCALE, RoundingMode.HALF_UP);
    }

    /**
     * Calculate the subtotal for an item based on quantity and unit price
     * @param quantity the quantity
     * @param unitPrice the unit price
     * @return calculated subtotal
     */
    public static BigDecimal calculateSubtotal(int quantity, BigDecimal unitPrice) {
        if (unitPrice == null) {
            return BigDecimal.ZERO;
        }
        return roundAmount(unitPrice.multiply(BigDecimal.valueOf(quantity)));
    }

    /**
     * Add tax to an amount
     * @param amount the base amount
     * @param taxRate the tax rate (e.g., 0.20 for 20% tax)
     * @return amount with tax
     */
    public static BigDecimal addTax(BigDecimal amount, BigDecimal taxRate) {
        if (amount == null || taxRate == null) {
            return amount;
        }

        BigDecimal taxAmount = amount.multiply(taxRate);
        return roundAmount(amount.add(taxAmount));
    }

    /**
     * Calculate the tax amount for a given base amount
     * @param amount the base amount
     * @param taxRate the tax rate (e.g., 0.20 for 20% tax)
     * @return the tax amount
     */
    public static BigDecimal calculateTaxAmount(BigDecimal amount, BigDecimal taxRate) {
        if (amount == null || taxRate == null) {
            return BigDecimal.ZERO;
        }

        return roundAmount(amount.multiply(taxRate));
    }
}