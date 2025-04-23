package com.secureops.sales.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public interface ReportService {

    /**
     * Get total sales for a date range
     * @param startDate Start date
     * @param endDate End date
     * @return Total sales amount
     */
    BigDecimal getTotalSales(LocalDateTime startDate, LocalDateTime endDate);

    /**
     * Get sales by client for a date range
     * @param startDate Start date
     * @param endDate End date
     * @return Map of client names to sales amounts
     */
    Map<String, BigDecimal> getSalesByClient(LocalDateTime startDate, LocalDateTime endDate);

    /**
     * Get sales by employee for a date range
     * @param startDate Start date
     * @param endDate End date
     * @return Map of employee names to sales amounts
     */
    Map<String, BigDecimal> getSalesByEmployee(LocalDateTime startDate, LocalDateTime endDate);

    /**
     * Get sales by product for a date range
     * @param startDate Start date
     * @param endDate End date
     * @return Map of product names to sales amounts
     */
    Map<String, BigDecimal> getSalesByProduct(LocalDateTime startDate, LocalDateTime endDate);

    /**
     * Get monthly sales for a year
     * @param year The year
     * @return List of monthly sales amounts
     */
    List<BigDecimal> getMonthlySales(int year);

    /**
     * Get quote conversion rate
     * @param startDate Start date
     * @param endDate End date
     * @return Quote conversion rate as percentage
     */
    double getQuoteConversionRate(LocalDateTime startDate, LocalDateTime endDate);

    /**
     * Get outstanding invoices
     * @return Total amount of outstanding invoices
     */
    BigDecimal getOutstandingInvoicesTotal();

    /**
     * Get overdue invoices
     * @return Total amount of overdue invoices
     */
    BigDecimal getOverdueInvoicesTotal();

    /**
     * Get top clients by sales volume
     * @param startDate Start date
     * @param endDate End date
     * @param limit Number of top clients to return
     * @return Map of client names to sales amounts
     */
    Map<String, BigDecimal> getTopClients(LocalDateTime startDate, LocalDateTime endDate, int limit);

    /**
     * Get top products by sales volume
     * @param startDate Start date
     * @param endDate End date
     * @param limit Number of top products to return
     * @return Map of product names to sales amounts
     */
    Map<String, BigDecimal> getTopProducts(LocalDateTime startDate, LocalDateTime endDate, int limit);

    /**
     * Get sales by date
     * @param startDate Start date
     * @param endDate End date
     * @return Map of dates to sales amounts
     */
    Map<LocalDateTime, BigDecimal> getSalesByDate(LocalDateTime startDate, LocalDateTime endDate);
}