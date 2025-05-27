package com.secureops.sales.util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;

/**
 * Utility class for date and time operations
 */
public class DateUtils {

    private DateUtils() {
        // Private constructor to prevent instantiation
    }

    /**
     * Returns the current date and time
     */
    public static LocalDateTime getCurrentDateTime() {
        return LocalDateTime.now();
    }

    /**
     * Returns the start of the day (00:00:00) for the given date
     */
    public static LocalDateTime getStartOfDay(LocalDateTime dateTime) {
        return LocalDate.from(dateTime).atStartOfDay();
    }

    /**
     * Returns the end of the day (23:59:59.999999999) for the given date
     */
    public static LocalDateTime getEndOfDay(LocalDateTime dateTime) {
        return LocalDate.from(dateTime).atTime(LocalTime.MAX);
    }

    /**
     * Returns the start of the month (1st day, 00:00:00) for the given date
     */
    public static LocalDateTime getStartOfMonth(LocalDateTime dateTime) {
        return YearMonth.from(dateTime).atDay(1).atStartOfDay();
    }

    /**
     * Returns the end of the month (last day, 23:59:59.999999999) for the given date
     */
    public static LocalDateTime getEndOfMonth(LocalDateTime dateTime) {
        return YearMonth.from(dateTime).atEndOfMonth().atTime(LocalTime.MAX);
    }

    /**
     * Formats a date according to the specified pattern
     */
    public static String formatDate(LocalDateTime dateTime, String pattern) {
        if (dateTime == null) {
            return null;
        }
        return dateTime.format(DateTimeFormatter.ofPattern(pattern));
    }

    /**
     * Formats a date using the default pattern (dd/MM/yyyy HH:mm)
     */
    public static String formatDate(LocalDateTime dateTime) {
        return formatDate(dateTime, "dd/MM/yyyy HH:mm");
    }

    /**
     * Parses a date string using the specified pattern
     */
    public static LocalDateTime parseDate(String dateString, String pattern) {
        if (dateString == null || dateString.isEmpty()) {
            return null;
        }
        return LocalDateTime.parse(dateString, DateTimeFormatter.ofPattern(pattern));
    }

    /**
     * Returns true if the first date is after the second date
     */
    public static boolean isAfter(LocalDateTime first, LocalDateTime second) {
        return first != null && second != null && first.isAfter(second);
    }

    /**
     * Returns true if the first date is before the second date
     */
    public static boolean isBefore(LocalDateTime first, LocalDateTime second) {
        return first != null && second != null && first.isBefore(second);
    }
}