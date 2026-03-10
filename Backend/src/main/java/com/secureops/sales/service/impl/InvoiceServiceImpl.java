package com.secureops.sales.service.impl;

import com.secureops.sales.dto.request.InvoiceRequest;
import com.secureops.sales.dto.response.InvoiceResponse;
import com.secureops.sales.entity.*;
import com.secureops.sales.exception.BusinessException;
import com.secureops.sales.exception.ResourceNotFoundException;
import com.secureops.sales.repository.ClientRepository;
import com.secureops.sales.repository.InvoiceRepository;
import com.secureops.sales.repository.OrderRepository;
import com.secureops.sales.service.InvoiceService;
import com.secureops.sales.util.DateUtils;
import com.secureops.sales.util.NumberGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InvoiceServiceImpl implements InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final OrderRepository orderRepository;
    private final ClientRepository clientRepository;
    private final NumberGenerator numberGenerator;

    @Override
    public List<InvoiceResponse> getAllInvoices() {
        return invoiceRepository.findAll()
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public InvoiceResponse getInvoiceById(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", id));
        return convertToResponse(invoice);
    }

    @Override
    public InvoiceResponse getInvoiceByNumber(String invoiceNumber) {
        Invoice invoice = invoiceRepository.findByInvoiceNumber(invoiceNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "invoiceNumber", invoiceNumber));
        return convertToResponse(invoice);
    }

    @Override
    @Transactional
    public InvoiceResponse createInvoice(InvoiceRequest request) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", request.getOrderId()));

        // Check if an invoice already exists for this order
        invoiceRepository.findByOrderId(request.getOrderId()).ifPresent(existingInvoice -> {
            throw new BusinessException("Invoice already exists for this order with invoice number: " + existingInvoice.getInvoiceNumber());
        });

        // Check if order status is appropriate for invoicing
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new BusinessException("Cannot create invoice for cancelled order");
        }

        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber(numberGenerator.generateInvoiceNumber());
        invoice.setCreatedDate(DateUtils.getCurrentDateTime());
        invoice.setClient(order.getClient());
        invoice.setOrder(order);
        invoice.setTotalAmount(order.getTotalAmount());
        invoice.setStatus(InvoiceStatus.PENDING);
        invoice.setPaymentDueDate(request.getPaymentDueDate());
        invoice.setNotes(request.getNotes());

        // Update order status
        order.setStatus(OrderStatus.INVOICED);
        orderRepository.save(order);

        Invoice savedInvoice = invoiceRepository.save(invoice);
        return convertToResponse(savedInvoice);
    }

    @Override
    @Transactional
    public InvoiceResponse updateInvoice(Long id, InvoiceRequest request) {
        Invoice existingInvoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", id));

        // Only allow updates if invoice is not paid yet
        if (existingInvoice.getStatus() == InvoiceStatus.PAID) {
            throw new BusinessException("Cannot update a paid invoice");
        }

        existingInvoice.setPaymentDueDate(request.getPaymentDueDate());
        existingInvoice.setNotes(request.getNotes());

        Invoice updatedInvoice = invoiceRepository.save(existingInvoice);
        return convertToResponse(updatedInvoice);
    }

    @Override
    @Transactional
    public void deleteInvoice(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", id));

        // Only allow deletion if invoice is not paid yet
        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new BusinessException("Cannot delete a paid invoice");
        }

        // Update order status back to COMPLETED
        Order order = invoice.getOrder();
        order.setStatus(OrderStatus.COMPLETED);
        orderRepository.save(order);

        invoiceRepository.delete(invoice);
    }

    @Override
    public List<InvoiceResponse> getInvoicesByClient(Long clientId) {
        // Verify client exists
        clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Client", "id", clientId));

        return invoiceRepository.findByClientId(clientId)
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<InvoiceResponse> getInvoicesByStatus(InvoiceStatus status) {
        return invoiceRepository.findByStatus(status)
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<InvoiceResponse> getInvoicesByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return invoiceRepository.findByCreatedDateBetween(startDate, endDate)
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public InvoiceResponse markInvoiceAsPaid(Long id, String paymentMethod) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", id));

        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new BusinessException("Invoice is already marked as paid");
        }

        invoice.setStatus(InvoiceStatus.PAID);
        invoice.setPaymentDate(DateUtils.getCurrentDateTime());
        invoice.setPaymentMethod(paymentMethod);

        Invoice updatedInvoice = invoiceRepository.save(invoice);
        return convertToResponse(updatedInvoice);
    }

    private InvoiceResponse convertToResponse(Invoice invoice) {
        if (invoice == null) {
            return null;
        }
        
        return InvoiceResponse.builder()
                .id(invoice.getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .createdDate(invoice.getCreatedDate())
                .clientId(invoice.getOrder() != null && invoice.getOrder().getClient() != null ? 
                         invoice.getOrder().getClient().getId() : null)
                .clientName(invoice.getOrder() != null && invoice.getOrder().getClient() != null ? 
                           invoice.getOrder().getClient().getName() : "Unknown Client")
                .clientEmail(invoice.getOrder() != null && invoice.getOrder().getClient() != null ? 
                            invoice.getOrder().getClient().getEmail() : null)
                .orderId(invoice.getOrder() != null ? invoice.getOrder().getId() : null)
                .orderNumber(invoice.getOrder() != null ? invoice.getOrder().getOrderNumber() : null)
                .totalAmount(invoice.getTotalAmount())
                .status(invoice.getStatus())
                .paymentDueDate(invoice.getPaymentDueDate())
                .paymentDate(invoice.getPaymentDate())
                .paymentMethod(invoice.getPaymentMethod())
                .notes(invoice.getNotes())
                .build();
    }
}