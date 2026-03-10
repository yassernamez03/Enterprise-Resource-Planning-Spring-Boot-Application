package com.secureops.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientSpendingReport {
    private Long clientId;
    private String clientName;
    private BigDecimal totalSpent;
    private Integer orderCount;
    private BigDecimal averageOrderValue;
    private LocalDateTime lastOrderDate;
    private Map<String, BigDecimal> monthlySpending;
    private List<ProductSalesSummary> topProducts;
}
