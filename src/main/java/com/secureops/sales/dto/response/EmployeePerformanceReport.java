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
public class EmployeePerformanceReport {
    private Long employeeId;
    private String employeeName;
    private Integer totalQuotes;
    private Integer acceptedQuotes;
    private BigDecimal conversionRate;
    private BigDecimal totalSales;
    private BigDecimal averageOrderValue;
    private Map<String, BigDecimal> monthlySales;
}
