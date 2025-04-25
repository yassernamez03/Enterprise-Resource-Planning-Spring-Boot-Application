package com.secureops.sales.service;

import com.secureops.sales.dto.request.InvoiceRequest;
import com.secureops.sales.dto.response.InvoiceResponse;
import com.secureops.sales.entity.InvoiceStatus;

import java.time.LocalDateTime;
import java.util.List;

public interface InvoiceService {
    List<InvoiceResponse> getAllInvoices();
    InvoiceResponse getInvoiceById(Long id);
    InvoiceResponse getInvoiceByNumber(String invoiceNumber);
    InvoiceResponse createInvoice(InvoiceRequest request);
    InvoiceResponse updateInvoice(Long id, InvoiceRequest request);
    void deleteInvoice(Long id);
    List<InvoiceResponse> getInvoicesByClient(Long clientId);
    List<InvoiceResponse> getInvoicesByStatus(InvoiceStatus status);
    List<InvoiceResponse> getInvoicesByDateRange(LocalDateTime startDate, LocalDateTime endDate);
    InvoiceResponse markInvoiceAsPaid(Long id, String paymentMethod);
}