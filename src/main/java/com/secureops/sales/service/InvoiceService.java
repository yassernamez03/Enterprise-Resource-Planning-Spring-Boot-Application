package com.secureops.sales.service;

import com.secureops.sales.dto.request.InvoiceRequest;
import com.secureops.sales.dto.response.InvoiceResponse;
import com.secureops.sales.entity.InvoiceStatus;

import java.time.LocalDateTime;
import java.util.List;

public interface InvoiceService {

    InvoiceResponse createInvoice(InvoiceRequest invoiceRequest);

    InvoiceResponse createInvoiceFromOrder(Long orderId);

    InvoiceResponse getInvoiceById(Long id);

    InvoiceResponse getInvoiceByNumber(String invoiceNumber);

    InvoiceResponse getInvoiceByOrderId(Long orderId);

    List<InvoiceResponse> getAllInvoices();

    List<InvoiceResponse> getInvoicesByClientId(Long clientId);

    List<InvoiceResponse> getInvoicesByStatus(InvoiceStatus status);

    List<InvoiceResponse> getInvoicesByDateRange(LocalDateTime startDate, LocalDateTime endDate);

    List<InvoiceResponse> getOverdueInvoices();

    InvoiceResponse updateInvoice(Long id, InvoiceRequest invoiceRequest);

    InvoiceResponse updateInvoiceStatus(Long id, InvoiceStatus status);

    InvoiceResponse markInvoiceAsPaid(Long id, LocalDateTime paymentDate, String paymentMethod);

    void deleteInvoice(Long id);

    List<InvoiceResponse> searchInvoices(String searchTerm, int page, int size);
}