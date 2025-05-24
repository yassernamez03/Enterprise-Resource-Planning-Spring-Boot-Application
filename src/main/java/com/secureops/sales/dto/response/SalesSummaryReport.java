package com.secureops.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalesSummaryReport {
    private BigDecimal totalSales;
    private Integer totalQuotes;
    private Integer acceptedQuotes;
    private Integer rejectedQuotes;
    private Integer totalOrders;
    private Integer completedOrders;
    private Integer cancelledOrders;
    private Integer totalInvoices;
    private Integer paidInvoices;
    private Integer overdueInvoices;
    private BigDecimal averageOrderValue;
    private Map<String, BigDecimal> monthlySales;
}

