package com.secureops.sales.service.impl;

import com.secureops.sales.entity.Invoice;
import com.secureops.sales.entity.InvoiceStatus;
import com.secureops.sales.entity.Order;
import com.secureops.sales.entity.OrderStatus;
import com.secureops.sales.exception.BusinessException;
import com.secureops.sales.exception.ResourceNotFoundException;
import com.secureops.sales.repository.InvoiceRepository;
import com.secureops.sales.repository.OrderRepository;
import com.secureops.sales.service.InvoiceService;
import com.secureops.sales.util.NumberGenerator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class InvoiceServiceImpl implements InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final OrderRepository orderRepository;
    private final NumberGenerator numberGenerator;

    @Autowired
    public InvoiceServiceImpl(InvoiceRepository invoiceRepository, OrderRepository orderRepository, NumberGenerator numberGenerator) {
        this.invoiceRepository = invoiceRepository;
        this.orderRepository = orderRepository;
        this.numberGenerator = numberGenerator;
    }

    @Override
    @Transactional
    public Invoice createInvoiceFromOrder(Order order) {
        // Check if order already has an invoice
        invoiceRepository.findByOrderId(order.getId()).ifPresent(invoice -> {
            throw new BusinessException("Order " + order.getOrderNumber() + " already has an invoice: " + invoice.getInvoiceNumber());
        });

        // Ensure order is in a state that can be invoiced
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new BusinessException("Cannot create invoice for cancelled order: " + order.getOrderNumber());
        }

        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber(numberGenerator.generateInvoiceNumber());
        invoice.setCreatedDate(LocalDateTime.now());
        invoice.setClient(order.getClient());
        invoice.setOrder(order);
        invoice.setTotalAmount(order.getTotalAmount());
        invoice.setStatus(InvoiceStatus.PENDING);

        // Set payment due date (e.g., 30 days from now)
        invoice.setPaymentDueDate(LocalDateTime.now().plusDays(30));

        // Update order status to INVOICED
        order.setStatus(OrderStatus.INVOICED);
        orderRepository.save(order);

        return invoiceRepository.save(invoice);
    }

    @Override
    public Invoice getInvoiceById(Long id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + id));
    }

    @Override
    public Invoice getInvoiceByInvoiceNumber(String invoiceNumber) {
        return invoiceRepository.findByInvoiceNumber(invoiceNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with number: " + invoiceNumber));
    }

    @Override
    public List<Invoice> getAllInvoices() {
        return invoiceRepository.findAll();
    }

    @Override
    public List<Invoice> getInvoicesByClientId(Long clientId) {
        return invoiceRepository.findByClientId(clientId);
    }

    @Override
    public Invoice getInvoiceByOrderId(Long orderId) {
        return invoiceRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found for order id: " + orderId));
    }

    @Override
    @Transactional
    public Invoice updateInvoice(Invoice invoice) {
        Invoice existingInvoice = getInvoiceById(invoice.getId());

        // Update only the fields that should be updatable
        existingInvoice.setPaymentDueDate(invoice.getPaymentDueDate());
        existingInvoice.setNotes(invoice.getNotes());

        return invoiceRepository.save(existingInvoice);
    }

    @Override
    @Transactional
    public Invoice updateInvoiceStatus(Long invoiceId, InvoiceStatus status) {
        Invoice invoice = getInvoiceById(invoiceId);
        invoice.setStatus(status);

        // If marking as paid and payment date not set, set it to now
        if (status == InvoiceStatus.PAID && invoice.getPaymentDate() == null) {
            invoice.setPaymentDate(LocalDateTime.now());
        }

        return invoiceRepository.save(invoice);
    }

    @Override
    @Transactional
    public Invoice markInvoiceAsPaid(Long invoiceId, LocalDateTime paymentDate, String paymentMethod) {
        Invoice invoice = getInvoiceById(invoiceId);
        invoice.setStatus(InvoiceStatus.PAID);
        invoice.setPaymentDate(paymentDate != null ? paymentDate : LocalDateTime.now());
        invoice.setPaymentMethod(paymentMethod);

        return invoiceRepository.save(invoice);
    }

    @Override
    public List<Invoice> getOverdueInvoices() {
        // Find invoices that are PENDING and past due date
        return invoiceRepository.findPendingInvoicesOverdue(LocalDateTime.now());
    }

    @Override
    public List<Invoice> searchInvoices(String searchTerm, int page, int size) {
        Page<Invoice> invoicePage = invoiceRepository.searchInvoices(
                searchTerm, PageRequest.of(page, size));
        return invoicePage.getContent();
    }

    @Override
    @Transactional
    public void deleteInvoice(Long id) {
        Invoice invoice = getInvoiceById(id);

        // If the invoice is associated with an order, update order status
        Order order = invoice.getOrder();
        if (order != null && order.getStatus() == OrderStatus.INVOICED) {
            order.setStatus(OrderStatus.COMPLETED); // Revert to previous status
            orderRepository.save(order);
        }

        invoiceRepository.delete(invoice);
    }

    // Utility method to update statuses of overdue invoices
    @Transactional
    public void updateOverdueInvoices() {
        LocalDateTime now = LocalDateTime.now();
        List<Invoice> overdueInvoices = invoiceRepository.findPendingInvoicesOverdue(now);

        for (Invoice invoice : overdueInvoices) {
            invoice.setStatus(InvoiceStatus.OVERDUE);
            invoiceRepository.save(invoice);
        }
    }
}