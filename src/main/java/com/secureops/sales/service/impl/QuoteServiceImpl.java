package com.secureops.sales.service.impl;

import com.secureops.sales.dto.request.QuoteItemRequest;
import com.secureops.sales.dto.request.QuoteRequest;
import com.secureops.sales.dto.response.OrderResponse;
import com.secureops.sales.dto.response.QuoteItemResponse;
import com.secureops.sales.dto.response.QuoteResponse;
import com.secureops.sales.entity.*;
import com.secureops.sales.exception.BusinessException;
import com.secureops.sales.exception.ResourceNotFoundException;
import com.secureops.sales.repository.ClientRepository;
import com.secureops.sales.repository.SalesEmployeeRepository;
import com.secureops.sales.repository.ProductRepository;
import com.secureops.sales.repository.QuoteRepository;
import com.secureops.sales.service.OrderService;
import com.secureops.sales.service.QuoteService;
import com.secureops.sales.util.DateUtils;
import com.secureops.sales.util.NumberGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuoteServiceImpl implements QuoteService {

    private final QuoteRepository quoteRepository;
    private final ClientRepository clientRepository;
    private final SalesEmployeeRepository employeeRepository;
    private final ProductRepository productRepository;
    private final NumberGenerator numberGenerator;

    @Lazy
    private final OrderService orderService;

    @Override
    public List<QuoteResponse> getAllQuotes() {
        return quoteRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public QuoteResponse getQuoteById(Long id) {
        Quote quote = quoteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quote", "id", id));
        return convertToResponse(quote);
    }

    @Override
    public QuoteResponse getQuoteByNumber(String quoteNumber) {
        Quote quote = quoteRepository.findByQuoteNumber(quoteNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Quote", "quoteNumber", quoteNumber));
        return convertToResponse(quote);
    }

    @Override
    @Transactional
    public QuoteResponse createQuote(QuoteRequest request) {
        // Get client
        Client client = clientRepository.findById(request.getClientId())
                .orElseThrow(() -> new ResourceNotFoundException("Client", "id", request.getClientId()));

        // Get employee
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", request.getEmployeeId()));

        // Create quote
        Quote quote = new Quote();
        quote.setQuoteNumber(numberGenerator.generateQuoteNumber());
        quote.setCreatedDate(DateUtils.getCurrentDateTime());
        quote.setClient(client);
        quote.setEmployee(employee);
        quote.setStatus(QuoteStatus.DRAFT);
        quote.setNotes(request.getNotes());

        // Create quote items
        List<QuoteItem> items = new ArrayList<>();
        for (QuoteItemRequest itemRequest : request.getItems()) {
            Product product = productRepository.findById(itemRequest.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", "id", itemRequest.getProductId()));

            QuoteItem item = new QuoteItem();
            item.setQuote(quote);
            item.setProduct(product);
            item.setQuantity(itemRequest.getQuantity());
            item.setUnitPrice(itemRequest.getUnitPrice() != null ? itemRequest.getUnitPrice() : product.getUnitPrice());
            item.setSubtotal(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
            item.setDescription(itemRequest.getDescription());
            items.add(item);
        }

        quote.setItems(items);
        quote.setTotalAmount(calculateTotal(items));

        Quote savedQuote = quoteRepository.save(quote);
        return convertToResponse(savedQuote);
    }

    @Override
    @Transactional
    public QuoteResponse updateQuote(Long id, QuoteRequest request) {
        Quote quote = quoteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quote", "id", id));

        if (quote.getStatus() == QuoteStatus.CONVERTED_TO_ORDER) {
            throw new BusinessException("Cannot update quote that has been converted to an order");
        }

        Client client = clientRepository.findById(request.getClientId())
                .orElseThrow(() -> new ResourceNotFoundException("Client", "id", request.getClientId()));

        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", request.getEmployeeId()));

        quote.setClient(client);
        quote.setEmployee(employee);
        quote.setNotes(request.getNotes());
        quote.setLastModifiedDate(DateUtils.getCurrentDateTime());

        // Update quote items properly
        List<QuoteItem> items = quote.getItems();
        items.clear();

        for (QuoteItemRequest itemRequest : request.getItems()) {
            Product product = productRepository.findById(itemRequest.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", "id", itemRequest.getProductId()));

            QuoteItem item = new QuoteItem();
            item.setQuote(quote);
            item.setProduct(product);
            item.setQuantity(itemRequest.getQuantity());
            item.setUnitPrice(itemRequest.getUnitPrice() != null ? itemRequest.getUnitPrice() : product.getUnitPrice());
            item.setSubtotal(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
            item.setDescription(itemRequest.getDescription());
            items.add(item);
        }

        quote.setTotalAmount(calculateTotal(items));

        Quote updatedQuote = quoteRepository.save(quote);
        return convertToResponse(updatedQuote);
    }

    @Override
    @Transactional
    public void deleteQuote(Long id) {
        Quote quote = quoteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quote", "id", id));

        // Check if quote can be deleted
        if (quote.getStatus() == QuoteStatus.CONVERTED_TO_ORDER) {
            throw new BusinessException("Cannot delete quote that has been converted to an order");
        }

        quoteRepository.delete(quote);
    }

    @Override
    public List<QuoteResponse> getQuotesByClient(Long clientId) {
        clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Client", "id", clientId));

        return quoteRepository.findByClientId(clientId).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<QuoteResponse> getQuotesByEmployee(Long employeeId) {
        employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", employeeId));

        return quoteRepository.findByEmployeeId(employeeId).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<QuoteResponse> getQuotesByStatus(QuoteStatus status) {
        return quoteRepository.findByStatus(status).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<QuoteResponse> getQuotesByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return quoteRepository.findByCreatedDateBetween(startDate, endDate).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public OrderResponse convertQuoteToOrder(Long quoteId) {
        Quote quote = quoteRepository.findById(quoteId)
                .orElseThrow(() -> new ResourceNotFoundException("Quote", "id", quoteId));

        // Check if quote can be converted
        if (quote.getStatus() == QuoteStatus.CONVERTED_TO_ORDER) {
            throw new BusinessException("Quote has already been converted to an order");
        }

        // Change quote status
        quote.setStatus(QuoteStatus.CONVERTED_TO_ORDER);
        quote.setLastModifiedDate(DateUtils.getCurrentDateTime());
        quoteRepository.save(quote);

        // Create order from quote
        return orderService.createOrderFromQuote(quote);
    }

    private BigDecimal calculateTotal(List<QuoteItem> items) {
        return items.stream()
                .map(QuoteItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private QuoteResponse convertToResponse(Quote quote) {
        List<QuoteItemResponse> itemResponses = quote.getItems().stream()
                .map(item -> QuoteItemResponse.builder()
                        .id(item.getId())
                        .productId(item.getProduct().getId())
                        .productName(item.getProduct().getName())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .subtotal(item.getSubtotal())
                        .description(item.getDescription())
                        .build())
                .collect(Collectors.toList());

        return QuoteResponse.builder()
                .id(quote.getId())
                .quoteNumber(quote.getQuoteNumber())
                .createdDate(quote.getCreatedDate())
                .clientId(quote.getClient().getId())
                .clientName(quote.getClient().getName())
                .employeeId(quote.getEmployee().getId())
                .employeeName(quote.getEmployee().getFullName())
                .items(itemResponses)
                .totalAmount(quote.getTotalAmount())
                .status(quote.getStatus())
                .notes(quote.getNotes())
                .build();
    }
}