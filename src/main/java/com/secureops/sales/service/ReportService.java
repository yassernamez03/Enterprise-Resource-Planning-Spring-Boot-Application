package com.secureops.sales.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public interface ReportService {

    // Sales reports
    BigDecimal getTotalSalesForPeriod(LocalDateTime startDate, LocalDateTime endDate);

    Map<String, BigDecimal> getMonthlySalesForYear(int year);

    // Employee performance reports
    Map<String, BigDecimal> getSalesByEmployee(LocalDateTime startDate, LocalDateTime endDate);

    Map<String, Integer> getQuoteCountByEmployee(LocalDateTime startDate, LocalDateTime endDate);

    Map<String, BigDecimal> getConversionRateByEmployee(LocalDateTime startDate, LocalDateTime endDate);

    // Client reports
    Map<String, BigDecimal> getTopClients(int limit, LocalDateTime startDate, LocalDateTime endDate);

    BigDecimal getTotalSalesByClient(Long clientId, LocalDateTime startDate, LocalDateTime endDate);

    // Product reports
    Map<String, Integer> getTopSellingProducts(int limit, LocalDateTime startDate, LocalDateTime endDate);

    // Status reports
    Map<String, Integer> getOrdersByStatus(LocalDateTime startDate, LocalDateTime endDate);

    Map<String, Integer> getInvoicesByStatus(LocalDateTime startDate, LocalDateTime endDate);

    // Financial reports
    BigDecimal getTotalOutstandingInvoicesAmount();

    BigDecimal getTotalOverdueInvoicesAmount();

    // Export reports
    byte[] exportSalesReport(LocalDateTime startDate, LocalDateTime endDate, String format);

    byte[] exportClientReport(Long clientId, LocalDateTime startDate, LocalDateTime endDate, String format);
}