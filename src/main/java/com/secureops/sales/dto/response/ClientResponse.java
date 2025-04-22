package com.secureops.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClientResponse {
    private Long id;
    private String name;
    private String contactPerson;
    private String email;
    private String phone;
    private String address;
    private LocalDateTime createdDate;
    private LocalDateTime lastModifiedDate;
    private String notes;
}