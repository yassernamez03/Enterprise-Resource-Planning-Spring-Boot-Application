package com.secureops.sales.service;

import com.secureops.sales.dto.request.OrderRequest;
import com.secureops.sales.dto.response.OrderResponse;
import com.secureops.sales.entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

public interface OrderService {

    List<OrderResponse> getAllOrders();

    Page<OrderResponse> getOrdersPaged(Pageable pageable);

    OrderResponse getOrderById(Long id);

    OrderResponse getOrderByNumber(String orderNumber);

    OrderResponse createOrder(OrderRequest orderRequest);

    OrderResponse createOrderFromQuote(Long quoteId);

    OrderResponse updateOrder(Long id, OrderRequest orderRequest);

    @Transactional
    OrderResponse updateOrderStatus(Long id, OrderStatus status);

    void deleteOrder(Long id);

    List<OrderResponse> getOrdersByClientId(Long clientId);

    List<OrderResponse> getOrdersByEmployeeId(Long employeeId);

    List<OrderResponse> getOrdersByStatus(OrderStatus status);

    List<OrderResponse> getOrdersByDateRange(LocalDateTime startDate, LocalDateTime endDate);

    OrderResponse changeOrderStatus(Long id, String status);

    Page<OrderResponse> searchOrders(String searchTerm, Pageable pageable);

    List<OrderResponse> getNonInvoicedOrders();

    String generateOrderNumber();

    List<OrderResponse> searchOrders(String searchTerm, int page, int size);
}