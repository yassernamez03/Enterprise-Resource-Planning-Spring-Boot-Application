package com.secureops.sales.dto.response;

import com.secureops.sales.entity.QuoteStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuoteResponse {
    private Long id;
    private String quoteNumber;
    private LocalDateTime createdDate;
    private Long clientId;
    private String clientName;
    private Long employeeId;
    private String employeeName;
    private List<QuoteItemResponse> items;
    private BigDecimal totalAmount;
    private QuoteStatus status;
    private String notes;
}