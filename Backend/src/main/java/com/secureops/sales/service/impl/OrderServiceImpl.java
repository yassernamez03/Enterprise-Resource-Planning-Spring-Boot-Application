package com.secureops.sales.service.impl;

import com.secureops.sales.dto.request.InvoiceRequest;
import com.secureops.sales.dto.request.OrderItemRequest;
import com.secureops.sales.dto.request.OrderRequest;
import com.secureops.sales.dto.response.InvoiceResponse;
import com.secureops.sales.dto.response.OrderItemResponse;
import com.secureops.sales.dto.response.OrderResponse;
import com.secureops.sales.dto.response.QuoteResponse;
import com.secureops.sales.entity.*;
import com.secureops.sales.exception.BusinessException;
import com.secureops.sales.exception.ResourceNotFoundException;
import com.secureops.sales.repository.ClientRepository;
import com.secureops.sales.repository.SalesEmployeeRepository;
import com.secureops.sales.repository.OrderRepository;
import com.secureops.sales.repository.ProductRepository;
import com.secureops.sales.repository.QuoteRepository;
import com.secureops.sales.service.InvoiceService;
import com.secureops.sales.service.OrderService;
import com.secureops.sales.util.DateUtils;
import com.secureops.sales.util.NumberGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final QuoteRepository quoteRepository;
    private final ClientRepository clientRepository;
    private final SalesEmployeeRepository salesEmployeeRepository;
    private final ProductRepository productRepository;
    private final NumberGenerator numberGenerator;

    @Lazy
    private final InvoiceService invoiceService;

    @Override
    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public OrderResponse getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));
        return convertToResponse(order);
    }

    @Override
    public OrderResponse getOrderByNumber(String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "orderNumber", orderNumber));
        return convertToResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse createOrder(OrderRequest request) {
        // Get client
        Client client = clientRepository.findById(request.getClientId())
                .orElseThrow(() -> new ResourceNotFoundException("Client", "id", request.getClientId()));

        // Get quote if provided
        Quote quote = null;
        if (request.getQuoteId() != null) {
            quote = quoteRepository.findById(request.getQuoteId())
                    .orElseThrow(() -> new ResourceNotFoundException("Quote", "id", request.getQuoteId()));

            // Check if quote has already been converted to an order
            if (quote.getStatus() == QuoteStatus.CONVERTED_TO_ORDER) {
                Optional<Order> existingOrder = orderRepository.findByQuoteId(quote.getId());
                if (existingOrder.isPresent()) {
                    throw new BusinessException("Quote has already been converted to order " + existingOrder.get().getOrderNumber());
                }
            }

            // Update quote status
            quote.setStatus(QuoteStatus.CONVERTED_TO_ORDER);
            quote.setLastModifiedDate(DateUtils.getCurrentDateTime());
            quoteRepository.save(quote);
        }

        // Create order
        Order order = new Order();
        order.setOrderNumber(numberGenerator.generateOrderNumber());
        order.setCreatedDate(DateUtils.getCurrentDateTime());
        order.setClient(client);
        order.setQuote(quote);
        order.setStatus(OrderStatus.PENDING);
        order.setNotes(request.getNotes());

        // Create order items
        List<OrderItem> items = new ArrayList<>();
        for (OrderItemRequest itemRequest : request.getItems()) {
            Product product = productRepository.findById(itemRequest.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", "id", itemRequest.getProductId()));

            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setProduct(product);
            item.setQuantity(itemRequest.getQuantity());
            item.setUnitPrice(itemRequest.getUnitPrice() != null ? itemRequest.getUnitPrice() : product.getUnitPrice());
            item.setSubtotal(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
            item.setDescription(itemRequest.getDescription());
            items.add(item);
        }

        order.setItems(items);
        order.setTotalAmount(calculateTotal(items));

        Order savedOrder = orderRepository.save(order);
        return convertToResponse(savedOrder);
    }

    @Override
    @Transactional
    public OrderResponse createOrderFromQuote(Quote quote) {
        // Create order items
        List<OrderItemRequest> itemRequests = quote.getItems().stream()
                .map(quoteItem -> OrderItemRequest.builder()
                        .productId(quoteItem.getProduct().getId())
                        .quantity(quoteItem.getQuantity())
                        .unitPrice(quoteItem.getUnitPrice())
                        .description(quoteItem.getDescription())
                        .build())
                .collect(Collectors.toList());

        // Create order request
        OrderRequest orderRequest = OrderRequest.builder()
                .clientId(quote.getClient().getId())
                .quoteId(quote.getId())
                .items(itemRequests)
                .notes("Created from quote " + quote.getQuoteNumber())
                .build();

        return createOrder(orderRequest);
    }

    @Override
    @Transactional
    public OrderResponse updateOrder(Long id, OrderRequest request) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));

        // Check if order can be updated
        if (order.getStatus() == OrderStatus.INVOICED || order.getStatus() == OrderStatus.COMPLETED) {
            throw new BusinessException("Cannot update order that has been completed or invoiced");
        }

        // Get client
        Client client = clientRepository.findById(request.getClientId())
                .orElseThrow(() -> new ResourceNotFoundException("Client", "id", request.getClientId()));

        // Update order
        order.setClient(client);
        order.setNotes(request.getNotes());
        order.setLastModifiedDate(DateUtils.getCurrentDateTime());

        // Update order items
        order.getItems().clear();

        for (OrderItemRequest itemRequest : request.getItems()) {
            Product product = productRepository.findById(itemRequest.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", "id", itemRequest.getProductId()));

            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setProduct(product);
            item.setQuantity(itemRequest.getQuantity());
            item.setUnitPrice(itemRequest.getUnitPrice() != null ? itemRequest.getUnitPrice() : product.getUnitPrice());
            item.setSubtotal(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
            item.setDescription(itemRequest.getDescription());
            order.getItems().add(item);
        }

        order.setTotalAmount(calculateTotal(order.getItems()));

        Order updatedOrder = orderRepository.save(order);
        return convertToResponse(updatedOrder);
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(Long id, OrderStatus newStatus) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));

        // Validate status transition
        validateOrderStatusTransition(order.getStatus(), newStatus);

        // Update status and last modified date
        order.setStatus(newStatus);
        order.setLastModifiedDate(DateUtils.getCurrentDateTime());

        Order updatedOrder = orderRepository.save(order);
        return convertToResponse(updatedOrder);
    }

    private void validateOrderStatusTransition(OrderStatus currentStatus, OrderStatus newStatus) {
        if (currentStatus == OrderStatus.INVOICED || currentStatus == OrderStatus.COMPLETED) {
            throw new BusinessException("Cannot modify an order that has been completed or invoiced");
        }

        // Define allowed status transitions
        switch (currentStatus) {
            case PENDING:
                if (!(newStatus == OrderStatus.IN_PROCESS ||
                        newStatus == OrderStatus.CANCELLED ||
                        newStatus == OrderStatus.PENDING)) {
                    throw new BusinessException("Invalid status transition from PENDING to " + newStatus);
                }
                break;
            case IN_PROCESS:
                if (!(newStatus == OrderStatus.COMPLETED ||
                        newStatus == OrderStatus.CANCELLED ||
                        newStatus == OrderStatus.IN_PROCESS)) {
                    throw new BusinessException("Invalid status transition from IN_PROCESS to " + newStatus);
                }
                break;
            case COMPLETED:
                if (newStatus != OrderStatus.COMPLETED) {
                    throw new BusinessException("Cannot change status from COMPLETED");
                }
                break;
            case CANCELLED:
                if (newStatus != OrderStatus.CANCELLED) {
                    throw new BusinessException("Cannot change status from CANCELLED");
                }
                break;
            case INVOICED:
                if (newStatus != OrderStatus.INVOICED) {
                    throw new BusinessException("Cannot change status from INVOICED");
                }
                break;
        }
    }

    @Override
    @Transactional
    public void deleteOrder(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));

        // If an order has an invoice, don't allow deletion
        if (order.getStatus() == OrderStatus.INVOICED) {
            throw new BusinessException("Cannot delete an order that has been invoiced");
        }

        // If the order was converted from a quote, update the quote status back to ACCEPTED
        if (order.getQuote() != null) {
            Quote quote = order.getQuote();
            quote.setStatus(QuoteStatus.ACCEPTED);
            quoteRepository.save(quote);
        }

        orderRepository.delete(order);
    }

    @Override
    public List<OrderResponse> getOrdersByClient(Long clientId) {
        return orderRepository.findByClientId(clientId).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<OrderResponse> getOrdersByStatus(OrderStatus status) {
        return orderRepository.findByStatus(status).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<OrderResponse> getOrdersByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return orderRepository.findByCreatedDateBetween(startDate, endDate).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public InvoiceResponse createInvoiceFromOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        // Verify order status
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new BusinessException("Cannot create invoice for a cancelled order");
        }

        if (order.getStatus() == OrderStatus.INVOICED) {
            throw new BusinessException("Invoice already exists for this order");
        }

        // Create invoice request
        InvoiceRequest invoiceRequest = new InvoiceRequest();
        invoiceRequest.setOrderId(orderId);
        invoiceRequest.setPaymentDueDate(DateUtils.getCurrentDateTime().plusDays(30)); // Default 30 days payment term
        invoiceRequest.setNotes("Invoice created from order " + order.getOrderNumber());

        // Create invoice
        InvoiceResponse invoiceResponse = invoiceService.createInvoice(invoiceRequest);

        // Update order status
        order.setStatus(OrderStatus.INVOICED);
        orderRepository.save(order);

        return invoiceResponse;
    }

    private BigDecimal calculateTotal(List<OrderItem> items) {
        return items.stream()
                .map(OrderItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Override
    public Page<OrderResponse> getAllOrders(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return orderRepository.findAll(pageable)
                .map(this::convertToResponse);
    }

    private OrderResponse convertToResponse(Order order) {
        OrderResponse response = new OrderResponse();
        response.setId(order.getId());
        response.setOrderNumber(order.getOrderNumber());
        response.setCreatedDate(order.getCreatedDate());
        response.setClientId(order.getClient().getId());
        response.setClientName(order.getClient().getName());

        if (order.getQuote() != null) {
            response.setQuoteId(order.getQuote().getId());
            response.setQuoteNumber(order.getQuote().getQuoteNumber());
        }

        response.setItems(order.getItems().stream()
                .map(this::convertItemToResponse)
                .collect(Collectors.toList()));

        response.setTotalAmount(order.getTotalAmount());
        response.setStatus(order.getStatus());
        response.setNotes(order.getNotes());

        return response;
    }

    private OrderItemResponse convertItemToResponse(OrderItem item) {
        OrderItemResponse response = new OrderItemResponse();
        response.setId(item.getId());
        response.setProductId(item.getProduct().getId());
        response.setProductName(item.getProduct().getName());
        response.setQuantity(item.getQuantity());
        response.setUnitPrice(item.getUnitPrice());
        response.setSubtotal(item.getSubtotal());
        response.setDescription(item.getDescription());
        return response;
    }
}