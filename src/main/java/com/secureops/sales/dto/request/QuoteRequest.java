package com.secureops.sales.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuoteRequest {

    @NotNull(message = "Client ID is required")
    private Long clientId;

    @NotEmpty(message = "At least one item is required")
    @Valid
    private List<QuoteItemRequest> items;

    @Size(max = 500, message = "Notes cannot exceed 500 characters")
    private String notes;
}