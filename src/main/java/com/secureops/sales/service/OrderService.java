package com.secureops.sales.service;

import com.secureops.sales.dto.request.OrderRequest;
import com.secureops.sales.dto.response.InvoiceResponse;
import com.secureops.sales.dto.response.OrderResponse;
import com.secureops.sales.entity.OrderStatus;
import com.secureops.sales.entity.Quote;

import java.time.LocalDateTime;
import java.util.List;

public interface OrderService {
    List<OrderResponse> getAllOrders();

    OrderResponse getOrderById(Long id);

    OrderResponse getOrderByNumber(String orderNumber);

    OrderResponse createOrder(OrderRequest request);

    OrderResponse createOrderFromQuote(Quote quote);

    OrderResponse updateOrder(Long id, OrderRequest request);

    void deleteOrder(Long id);

    List<OrderResponse> getOrdersByClient(Long clientId);
    List<OrderResponse> getOrdersByEmployee(Long employeeId);

    List<OrderResponse> getOrdersByStatus(OrderStatus status);
    List<OrderResponse> getOrdersByDateRange(LocalDateTime startDate, LocalDateTime endDate);

    InvoiceResponse createInvoiceFromOrder(Long orderId);
}