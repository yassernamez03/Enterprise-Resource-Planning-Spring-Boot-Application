package com.secureops.sales.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceRequest {
    @NotNull(message = "Order ID is required")
    private Long orderId;

    @NotNull(message = "Payment due date is required")
    private LocalDateTime paymentDueDate;

    private String paymentMethod;
    private String notes;
}