package com.secureops.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductSalesSummary {
    private Long productId;
    private String productName;
    private Integer quantitySold;
    private BigDecimal totalRevenue;
}
