package com.secureops.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuoteItemResponse {
    private Long id;
    private ProductResponse product;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal subtotal;
    private String description;

    public void setProductName(String name) {
    }

    public void setProductId(Long id) {

    }
}