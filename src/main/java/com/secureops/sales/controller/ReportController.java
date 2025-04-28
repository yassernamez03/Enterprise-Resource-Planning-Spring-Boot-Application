package com.secureops.sales.controller;

import com.secureops.sales.dto.response.ClientSpendingReport;
import com.secureops.sales.dto.response.EmployeePerformanceReport;
import com.secureops.sales.dto.response.ProductSalesReport;
import com.secureops.sales.dto.response.SalesSummaryReport;
import com.secureops.sales.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/sales/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/sales-summary")
    public ResponseEntity<SalesSummaryReport> getSalesSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        return ResponseEntity.ok(reportService.getSalesSummary(startDate, endDate));
    }

    @GetMapping("/employee-performance/{employeeId}")
    public ResponseEntity<EmployeePerformanceReport> getEmployeePerformance(
            @PathVariable Long employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        return ResponseEntity.ok(reportService.getEmployeePerformance(employeeId, startDate, endDate));
    }

    @GetMapping("/client-spending/{clientId}")
    public ResponseEntity<ClientSpendingReport> getClientSpendingReport(
            @PathVariable Long clientId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        return ResponseEntity.ok(reportService.getClientSpendingReport(clientId, startDate, endDate));
    }

    @GetMapping("/product-sales")
    public ResponseEntity<ProductSalesReport> getProductSalesReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        return ResponseEntity.ok(reportService.getProductSalesReport(startDate, endDate));
    }
}