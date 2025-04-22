package com.secureops.sales.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClientRequest {
    @NotBlank(message = "Client name is required")
    private String name;

    private String contactPerson;

    @Email(message = "Please provide a valid email address")
    private String email;

    private String phone;
    private String address;
    private String notes;
}