package com.secureops.sales.dto.response;

import com.secureops.sales.entity.InvoiceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceResponse {
    private Long id;
    private String invoiceNumber;
    private LocalDateTime createdDate;
    private ClientResponse client;
    private String orderNumber;
    private BigDecimal totalAmount;
    private InvoiceStatus status;
    private LocalDateTime paymentDueDate;
    private LocalDateTime paymentDate;
    private String paymentMethod;
    private String notes;
}