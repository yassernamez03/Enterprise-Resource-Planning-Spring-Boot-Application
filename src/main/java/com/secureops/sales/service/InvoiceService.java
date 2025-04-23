package com.secureops.sales.service;

import com.secureops.sales.entity.Invoice;
import com.secureops.sales.entity.InvoiceStatus;
import com.secureops.sales.entity.Order;

import java.time.LocalDateTime;
import java.util.List;

public interface InvoiceService {

    /**
     * Create an invoice from an order
     * @param order The order to create an invoice from
     * @return The created invoice
     */
    Invoice createInvoiceFromOrder(Order order);

    /**
     * Get an invoice by ID
     * @param id The invoice ID
     * @return The invoice
     */
    Invoice getInvoiceById(Long id);

    /**
     * Get an invoice by invoice number
     * @param invoiceNumber The invoice number
     * @return The invoice
     */
    Invoice getInvoiceByInvoiceNumber(String invoiceNumber);

    /**
     * Get all invoices
     * @return List of all invoices
     */
    List<Invoice> getAllInvoices();

    /**
     * Get invoices by client ID
     * @param clientId The client ID
     * @return List of invoices for the client
     */
    List<Invoice> getInvoicesByClientId(Long clientId);

    /**
     * Get invoice by order ID
     * @param orderId The order ID
     * @return The invoice for the order
     */
    Invoice getInvoiceByOrderId(Long orderId);

    /**
     * Update an invoice
     * @param invoice The invoice to update
     * @return The updated invoice
     */
    Invoice updateInvoice(Invoice invoice);

    /**
     * Update invoice status
     * @param invoiceId The invoice ID
     * @param status The new status
     * @return The updated invoice
     */
    Invoice updateInvoiceStatus(Long invoiceId, InvoiceStatus status);

    /**
     * Mark invoice as paid
     * @param invoiceId The invoice ID
     * @param paymentDate The payment date
     * @param paymentMethod The payment method
     * @return The updated invoice
     */
    Invoice markInvoiceAsPaid(Long invoiceId, LocalDateTime paymentDate, String paymentMethod);

    /**
     * Get overdue invoices
     * @return List of overdue invoices
     */
    List<Invoice> getOverdueInvoices();

    /**
     * Search invoices by term
     * @param searchTerm The search term
     * @param page The page number
     * @param size The page size
     * @return List of matching invoices
     */
    List<Invoice> searchInvoices(String searchTerm, int page, int size);

    /**
     * Delete an invoice
     * @param id The invoice ID
     */
    void deleteInvoice(Long id);
}