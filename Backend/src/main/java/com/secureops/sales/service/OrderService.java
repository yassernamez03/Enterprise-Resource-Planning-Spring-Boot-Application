package com.secureops.sales.service;

import com.secureops.sales.dto.request.OrderRequest;
import com.secureops.sales.dto.response.InvoiceResponse;
import com.secureops.sales.dto.response.OrderResponse;
import com.secureops.sales.dto.response.QuoteResponse;
import com.secureops.sales.entity.Order;
import com.secureops.sales.entity.OrderStatus;
import com.secureops.sales.entity.Quote;
import com.secureops.sales.entity.QuoteStatus;
import org.springframework.data.domain.Page;

import java.time.LocalDateTime;
import java.util.List;

public interface OrderService {
    List<OrderResponse> getAllOrders();

    OrderResponse getOrderById(Long id);

    OrderResponse getOrderByNumber(String orderNumber);

    OrderResponse createOrder(OrderRequest request);

    OrderResponse createOrderFromQuote(Quote quote);

    OrderResponse updateOrder(Long id, OrderRequest request);

    OrderResponse updateOrderStatus(Long id, OrderStatus status);

    void deleteOrder(Long id);

    List<OrderResponse> getOrdersByClient(Long clientId);

    List<OrderResponse> getOrdersByStatus(OrderStatus status);
    List<OrderResponse> getOrdersByDateRange(LocalDateTime startDate, LocalDateTime endDate);

    InvoiceResponse createInvoiceFromOrder(Long orderId);

    Page<OrderResponse> getAllOrders(int page, int size);

}