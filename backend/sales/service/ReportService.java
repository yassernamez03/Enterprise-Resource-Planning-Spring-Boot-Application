package com.secureops.sales.service;

import com.secureops.sales.dto.response.ClientSpendingReport;
import com.secureops.sales.dto.response.EmployeePerformanceReport;
import com.secureops.sales.dto.response.ProductSalesReport;
import com.secureops.sales.dto.response.SalesSummaryReport;

import java.time.LocalDateTime;

public interface ReportService {
    SalesSummaryReport getSalesSummary(LocalDateTime startDate, LocalDateTime endDate);
    ClientSpendingReport getClientSpendingReport(Long clientId, LocalDateTime startDate, LocalDateTime endDate);
    ProductSalesReport getProductSalesReport(LocalDateTime startDate, LocalDateTime endDate);
}