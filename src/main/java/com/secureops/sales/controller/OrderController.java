package com.secureops.sales.controller;

import com.secureops.sales.dto.request.OrderRequest;
import com.secureops.sales.dto.response.InvoiceResponse;
import com.secureops.sales.dto.response.OrderResponse;
import com.secureops.sales.entity.OrderStatus;
import com.secureops.sales.service.OrderService;
import com.secureops.service.LogService;
import com.secureops.service.UserService;
import com.secureops.util.AppConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/sales/orders")
public class OrderController {

    private static final Logger logger = LoggerFactory.getLogger(OrderController.class);
    private static final Logger securityLogger = LoggerFactory.getLogger("com.secureops.security");

    private final OrderService orderService;
    private final LogService logService;
    private final UserService userService;

    @Autowired
    public OrderController(OrderService orderService, LogService logService, UserService userService) {
        this.orderService = orderService;
        this.logService = logService;
        this.userService = userService;
        logger.info("OrderController initialized");
    }    @GetMapping
    public ResponseEntity<Page<OrderResponse>> getAllOrders(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size){
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("All orders retrieval request - userId: {}, username: {}, page: {}, size: {}, ip: {}", 
                currentUserId, currentUsername, page, size, clientIp);
        
        securityLogger.info("SALES_ORDERS_LIST_ACCESS - User: {} (ID: {}), IP: {}, Action: VIEW_ALL_ORDERS", 
                currentUsername, currentUserId, clientIp);
        
        try {
            // Validate pagination parameters
            if (page < 0 || size <= 0 || size > 100) {
                logger.warn("Invalid pagination parameters - page: {}, size: {}, userId: {}, ip: {}", 
                        page, size, currentUserId, clientIp);
                securityLogger.warn("INVALID_PAGINATION_PARAMETERS - User: {} (ID: {}), IP: {}, Page: {}, Size: {}", 
                        currentUsername, currentUserId, clientIp, page, size);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_READ,
                        "Invalid pagination parameters for orders list - page: " + page + ", size: " + size,
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            Page<OrderResponse> orders = orderService.getAllOrders(page, size);
            
            logger.info("All orders retrieved successfully - count: {}, userId: {}, ip: {}", 
                    orders.getTotalElements(), currentUserId, clientIp);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Retrieved orders list - page: " + page + ", size: " + size + ", total: " + orders.getTotalElements(),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(orders);
            
        } catch (Exception e) {
            logger.error("Error retrieving orders - userId: {}, username: {}, ip: {}", 
                    currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_ORDERS_LIST_ERROR - User: {} (ID: {}), IP: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve orders list: " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable Long id) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Order by ID retrieval request - orderId: {}, userId: {}, username: {}, ip: {}", 
                id, currentUserId, currentUsername, clientIp);
        
        securityLogger.info("SALES_ORDER_DETAIL_ACCESS - User: {} (ID: {}), IP: {}, OrderId: {}, Action: VIEW_ORDER", 
                currentUsername, currentUserId, clientIp, id);
        
        try {
            // Validate order ID
            if (id == null || id <= 0) {
                logger.warn("Invalid order ID parameter: {} - userId: {}, ip: {}", 
                        id, currentUserId, clientIp);
                securityLogger.warn("INVALID_ORDER_ID_PARAMETER - User: {} (ID: {}), IP: {}, InvalidOrderId: {}", 
                        currentUsername, currentUserId, clientIp, id);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_READ,
                        "Invalid order ID parameter: " + id,
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            // Validate path parameter for security
            validateInputSecurity(String.valueOf(id), clientIp);
            
            OrderResponse order = orderService.getOrderById(id);
            
            logger.info("Order retrieved successfully - orderId: {}, orderNumber: {}, userId: {}, ip: {}", 
                    id, order.getOrderNumber(), currentUserId, clientIp);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Retrieved order details - ID: " + id + ", Number: " + order.getOrderNumber(),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(order);
            
        } catch (Exception e) {
            logger.error("Error retrieving order {} - userId: {}, username: {}, ip: {}", 
                    id, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_ORDER_DETAIL_ERROR - User: {} (ID: {}), IP: {}, OrderId: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, id, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve order " + id + ": " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/number/{orderNumber}")
    public ResponseEntity<OrderResponse> getOrderByNumber(@PathVariable String orderNumber) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Order by number retrieval request - orderNumber: {}, userId: {}, username: {}, ip: {}", 
                orderNumber, currentUserId, currentUsername, clientIp);
        
        securityLogger.info("SALES_ORDER_NUMBER_ACCESS - User: {} (ID: {}), IP: {}, OrderNumber: {}, Action: VIEW_ORDER_BY_NUMBER", 
                currentUsername, currentUserId, clientIp, orderNumber);
        
        try {
            // Validate order number
            if (orderNumber == null || orderNumber.trim().isEmpty()) {
                logger.warn("Invalid order number parameter: {} - userId: {}, ip: {}", 
                        orderNumber, currentUserId, clientIp);
                securityLogger.warn("INVALID_ORDER_NUMBER_PARAMETER - User: {} (ID: {}), IP: {}, InvalidOrderNumber: {}", 
                        currentUsername, currentUserId, clientIp, orderNumber);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_READ,
                        "Invalid order number parameter: " + orderNumber,
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            // Validate input security
            validateInputSecurity(orderNumber, clientIp);
            
            OrderResponse order = orderService.getOrderByNumber(orderNumber);
            
            logger.info("Order retrieved by number successfully - orderNumber: {}, orderId: {}, userId: {}, ip: {}", 
                    orderNumber, order.getId(), currentUserId, clientIp);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Retrieved order by number - Number: " + orderNumber + ", ID: " + order.getId(),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(order);
            
        } catch (Exception e) {
            logger.error("Error retrieving order by number {} - userId: {}, username: {}, ip: {}", 
                    orderNumber, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_ORDER_NUMBER_ERROR - User: {} (ID: {}), IP: {}, OrderNumber: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, orderNumber, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve order by number " + orderNumber + ": " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/create")
    public ResponseEntity<OrderResponse> createOrder(@Valid @RequestBody OrderRequest request, BindingResult bindingResult) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Order creation request - userId: {}, username: {}, ip: {}", 
                currentUserId, currentUsername, clientIp);
        
        securityLogger.info("SALES_ORDER_CREATE_REQUEST - User: {} (ID: {}), IP: {}, Action: CREATE_ORDER", 
                currentUsername, currentUserId, clientIp);
        
        try {
            // Validate binding results
            if (bindingResult.hasErrors()) {
                logger.warn("Validation errors in order creation - userId: {}, ip: {}, errors: {}", 
                        currentUserId, clientIp, bindingResult.getAllErrors());
                securityLogger.warn("ORDER_VALIDATION_ERRORS - User: {} (ID: {}), IP: {}, Errors: {}", 
                        currentUsername, currentUserId, clientIp, bindingResult.getAllErrors());
                
                logService.createLog(
                        AppConstants.LOG_ACTION_CREATE,
                        "Order creation validation errors: " + bindingResult.getAllErrors(),
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            // Validate input security
            if (request.getNotes() != null) {
                validateInputSecurity(request.getNotes(), clientIp);
            }
            
            OrderResponse createdOrder = orderService.createOrder(request);
            
            logger.info("Order created successfully - orderId: {}, orderNumber: {}, userId: {}, ip: {}", 
                    createdOrder.getId(), createdOrder.getOrderNumber(), currentUserId, clientIp);
            
            securityLogger.info("SALES_ORDER_CREATED - User: {} (ID: {}), IP: {}, OrderId: {}, OrderNumber: {}", 
                    currentUsername, currentUserId, clientIp, createdOrder.getId(), createdOrder.getOrderNumber());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "Created new order - ID: " + createdOrder.getId() + ", Number: " + createdOrder.getOrderNumber(),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return new ResponseEntity<>(createdOrder, HttpStatus.CREATED);
            
        } catch (Exception e) {
            logger.error("Error creating order - userId: {}, username: {}, ip: {}", 
                    currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_ORDER_CREATE_ERROR - User: {} (ID: {}), IP: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "Failed to create order: " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }
    }    @PutMapping("/update/{id}")
    public ResponseEntity<OrderResponse> updateOrder(@PathVariable Long id, @Valid @RequestBody OrderRequest request, BindingResult bindingResult) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Order update request - orderId: {}, userId: {}, username: {}, ip: {}", 
                id, currentUserId, currentUsername, clientIp);
        
        securityLogger.info("SALES_ORDER_UPDATE_REQUEST - User: {} (ID: {}), IP: {}, OrderId: {}, Action: UPDATE_ORDER", 
                currentUsername, currentUserId, clientIp, id);
        
        try {
            // Validate order ID
            if (id == null || id <= 0) {
                logger.warn("Invalid order ID for update: {} - userId: {}, ip: {}", 
                        id, currentUserId, clientIp);
                securityLogger.warn("INVALID_ORDER_UPDATE_ID - User: {} (ID: {}), IP: {}, InvalidOrderId: {}", 
                        currentUsername, currentUserId, clientIp, id);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_UPDATE,
                        "Invalid order ID for update: " + id,
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            // Validate binding results
            if (bindingResult.hasErrors()) {
                logger.warn("Validation errors in order update - orderId: {}, userId: {}, ip: {}, errors: {}", 
                        id, currentUserId, clientIp, bindingResult.getAllErrors());
                securityLogger.warn("ORDER_UPDATE_VALIDATION_ERRORS - User: {} (ID: {}), IP: {}, OrderId: {}, Errors: {}", 
                        currentUsername, currentUserId, clientIp, id, bindingResult.getAllErrors());
                
                logService.createLog(
                        AppConstants.LOG_ACTION_UPDATE,
                        "Order update validation errors for ID " + id + ": " + bindingResult.getAllErrors(),
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            // Validate input security
            validateInputSecurity(String.valueOf(id), clientIp);
            if (request.getNotes() != null) {
                validateInputSecurity(request.getNotes(), clientIp);
            }
            
            OrderResponse updatedOrder = orderService.updateOrder(id, request);
            
            logger.info("Order updated successfully - orderId: {}, orderNumber: {}, userId: {}, ip: {}", 
                    id, updatedOrder.getOrderNumber(), currentUserId, clientIp);
            
            securityLogger.info("SALES_ORDER_UPDATED - User: {} (ID: {}), IP: {}, OrderId: {}, OrderNumber: {}", 
                    currentUsername, currentUserId, clientIp, id, updatedOrder.getOrderNumber());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_UPDATE,
                    "Updated order - ID: " + id + ", Number: " + updatedOrder.getOrderNumber(),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(updatedOrder);
            
        } catch (Exception e) {
            logger.error("Error updating order {} - userId: {}, username: {}, ip: {}", 
                    id, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_ORDER_UPDATE_ERROR - User: {} (ID: {}), IP: {}, OrderId: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, id, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_UPDATE,
                    "Failed to update order " + id + ": " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }
    }    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Order deletion request - orderId: {}, userId: {}, username: {}, ip: {}", 
                id, currentUserId, currentUsername, clientIp);
        
        securityLogger.info("SALES_ORDER_DELETE_REQUEST - User: {} (ID: {}), IP: {}, OrderId: {}, Action: DELETE_ORDER", 
                currentUsername, currentUserId, clientIp, id);
        
        try {
            // Validate order ID
            if (id == null || id <= 0) {
                logger.warn("Invalid order ID for deletion: {} - userId: {}, ip: {}", 
                        id, currentUserId, clientIp);
                securityLogger.warn("INVALID_ORDER_DELETE_ID - User: {} (ID: {}), IP: {}, InvalidOrderId: {}", 
                        currentUsername, currentUserId, clientIp, id);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_DELETE,
                        "Invalid order ID for deletion: " + id,
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            // Validate path parameter for security
            validateInputSecurity(String.valueOf(id), clientIp);
            
            orderService.deleteOrder(id);
            
            logger.info("Order deleted successfully - orderId: {}, userId: {}, ip: {}", 
                    id, currentUserId, clientIp);
            
            securityLogger.info("SALES_ORDER_DELETED - User: {} (ID: {}), IP: {}, OrderId: {}", 
                    currentUsername, currentUserId, clientIp, id);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_DELETE,
                    "Deleted order - ID: " + id,
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.noContent().build();
            
        } catch (Exception e) {
            logger.error("Error deleting order {} - userId: {}, username: {}, ip: {}", 
                    id, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_ORDER_DELETE_ERROR - User: {} (ID: {}), IP: {}, OrderId: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, id, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_DELETE,
                    "Failed to delete order " + id + ": " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }
    }    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<OrderResponse>> getOrdersByClient(@PathVariable Long clientId) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Orders by client request - clientId: {}, userId: {}, username: {}, ip: {}", 
                clientId, currentUserId, currentUsername, clientIp);
        
        securityLogger.info("SALES_ORDERS_BY_CLIENT_REQUEST - User: {} (ID: {}), IP: {}, ClientId: {}, Action: VIEW_CLIENT_ORDERS", 
                currentUsername, currentUserId, clientIp, clientId);
        
        try {
            // Validate client ID
            if (clientId == null || clientId <= 0) {
                logger.warn("Invalid client ID parameter: {} - userId: {}, ip: {}", 
                        clientId, currentUserId, clientIp);
                securityLogger.warn("INVALID_CLIENT_ID_PARAMETER - User: {} (ID: {}), IP: {}, InvalidClientId: {}", 
                        currentUsername, currentUserId, clientIp, clientId);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_READ,
                        "Invalid client ID parameter: " + clientId,
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            // Validate path parameter for security
            validateInputSecurity(String.valueOf(clientId), clientIp);
            
            List<OrderResponse> orders = orderService.getOrdersByClient(clientId);
            
            logger.info("Orders by client retrieved successfully - clientId: {}, orderCount: {}, userId: {}, ip: {}", 
                    clientId, orders.size(), currentUserId, clientIp);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Retrieved orders by client - ClientId: " + clientId + ", Count: " + orders.size(),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(orders);
            
        } catch (Exception e) {
            logger.error("Error retrieving orders by client {} - userId: {}, username: {}, ip: {}", 
                    clientId, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_ORDERS_BY_CLIENT_ERROR - User: {} (ID: {}), IP: {}, ClientId: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, clientId, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve orders by client " + clientId + ": " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }
    }    @GetMapping("/status/{status}")
    public ResponseEntity<List<OrderResponse>> getOrdersByStatus(@PathVariable OrderStatus status) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Orders by status request - status: {}, userId: {}, username: {}, ip: {}", 
                status, currentUserId, currentUsername, clientIp);
        
        securityLogger.info("SALES_ORDERS_BY_STATUS_REQUEST - User: {} (ID: {}), IP: {}, Status: {}, Action: VIEW_ORDERS_BY_STATUS", 
                currentUsername, currentUserId, clientIp, status);
        
        try {
            // Validate status parameter
            if (status == null) {
                logger.warn("Null order status parameter - userId: {}, ip: {}", 
                        currentUserId, clientIp);
                securityLogger.warn("NULL_ORDER_STATUS_PARAMETER - User: {} (ID: {}), IP: {}", 
                        currentUsername, currentUserId, clientIp);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_READ,
                        "Null order status parameter",
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            // Validate status parameter for security
            validateInputSecurity(status.toString(), clientIp);
            
            List<OrderResponse> orders = orderService.getOrdersByStatus(status);
            
            logger.info("Orders by status retrieved successfully - status: {}, orderCount: {}, userId: {}, ip: {}", 
                    status, orders.size(), currentUserId, clientIp);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Retrieved orders by status - Status: " + status + ", Count: " + orders.size(),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(orders);
            
        } catch (Exception e) {
            logger.error("Error retrieving orders by status {} - userId: {}, username: {}, ip: {}", 
                    status, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_ORDERS_BY_STATUS_ERROR - User: {} (ID: {}), IP: {}, Status: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, status, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve orders by status " + status + ": " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }
    }    @PutMapping("/{id}/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam OrderStatus status) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Order status update request - orderId: {}, newStatus: {}, userId: {}, username: {}, ip: {}", 
                id, status, currentUserId, currentUsername, clientIp);
        
        securityLogger.info("SALES_ORDER_STATUS_UPDATE_REQUEST - User: {} (ID: {}), IP: {}, OrderId: {}, NewStatus: {}, Action: UPDATE_ORDER_STATUS", 
                currentUsername, currentUserId, clientIp, id, status);
        
        try {
            // Validate order ID
            if (id == null || id <= 0) {
                logger.warn("Invalid order ID for status update: {} - userId: {}, ip: {}", 
                        id, currentUserId, clientIp);
                securityLogger.warn("INVALID_ORDER_STATUS_UPDATE_ID - User: {} (ID: {}), IP: {}, InvalidOrderId: {}", 
                        currentUsername, currentUserId, clientIp, id);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_UPDATE,
                        "Invalid order ID for status update: " + id,
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            // Validate status parameter
            if (status == null) {
                logger.warn("Null status parameter for order {} - userId: {}, ip: {}", 
                        id, currentUserId, clientIp);
                securityLogger.warn("NULL_ORDER_STATUS_UPDATE - User: {} (ID: {}), IP: {}, OrderId: {}", 
                        currentUsername, currentUserId, clientIp, id);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_UPDATE,
                        "Null status parameter for order " + id,
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            // Validate parameters for security
            validateInputSecurity(String.valueOf(id), clientIp);
            validateInputSecurity(status.toString(), clientIp);
            
            OrderResponse updatedOrder = orderService.updateOrderStatus(id, status);
            
            logger.info("Order status updated successfully - orderId: {}, newStatus: {}, userId: {}, ip: {}", 
                    id, status, currentUserId, clientIp);
            
            securityLogger.info("SALES_ORDER_STATUS_UPDATED - User: {} (ID: {}), IP: {}, OrderId: {}, NewStatus: {}", 
                    currentUsername, currentUserId, clientIp, id, status);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_UPDATE,
                    "Updated order status - ID: " + id + ", Status: " + status,
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(updatedOrder);
            
        } catch (Exception e) {
            logger.error("Error updating order status - orderId: {}, status: {}, userId: {}, username: {}, ip: {}", 
                    id, status, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_ORDER_STATUS_UPDATE_ERROR - User: {} (ID: {}), IP: {}, OrderId: {}, Status: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, id, status, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_UPDATE,
                    "Failed to update order status - ID: " + id + ", Status: " + status + ": " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }
    }    @GetMapping("/date-range")
    public ResponseEntity<List<OrderResponse>> getOrdersByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Orders by date range request - startDate: {}, endDate: {}, userId: {}, username: {}, ip: {}", 
                startDate, endDate, currentUserId, currentUsername, clientIp);
        
        securityLogger.info("SALES_ORDERS_BY_DATE_RANGE_REQUEST - User: {} (ID: {}), IP: {}, StartDate: {}, EndDate: {}, Action: VIEW_ORDERS_BY_DATE_RANGE", 
                currentUsername, currentUserId, clientIp, startDate, endDate);
        
        try {
            // Validate date parameters
            if (startDate == null || endDate == null) {
                logger.warn("Null date parameters - startDate: {}, endDate: {}, userId: {}, ip: {}", 
                        startDate, endDate, currentUserId, clientIp);
                securityLogger.warn("NULL_DATE_PARAMETERS - User: {} (ID: {}), IP: {}, StartDate: {}, EndDate: {}", 
                        currentUsername, currentUserId, clientIp, startDate, endDate);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_READ,
                        "Null date parameters - Start: " + startDate + ", End: " + endDate,
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            // Validate date range logic
            if (startDate.isAfter(endDate)) {
                logger.warn("Invalid date range - startDate: {}, endDate: {}, userId: {}, ip: {}", 
                        startDate, endDate, currentUserId, clientIp);
                securityLogger.warn("INVALID_DATE_RANGE - User: {} (ID: {}), IP: {}, StartDate: {}, EndDate: {}", 
                        currentUsername, currentUserId, clientIp, startDate, endDate);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_READ,
                        "Invalid date range - Start: " + startDate + ", End: " + endDate,
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            List<OrderResponse> orders = orderService.getOrdersByDateRange(startDate, endDate);
            
            logger.info("Orders by date range retrieved successfully - startDate: {}, endDate: {}, orderCount: {}, userId: {}, ip: {}", 
                    startDate, endDate, orders.size(), currentUserId, clientIp);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Retrieved orders by date range - Start: " + startDate + ", End: " + endDate + ", Count: " + orders.size(),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(orders);
            
        } catch (Exception e) {
            logger.error("Error retrieving orders by date range - startDate: {}, endDate: {}, userId: {}, username: {}, ip: {}", 
                    startDate, endDate, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_ORDERS_BY_DATE_RANGE_ERROR - User: {} (ID: {}), IP: {}, StartDate: {}, EndDate: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, startDate, endDate, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve orders by date range - Start: " + startDate + ", End: " + endDate + ": " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }
    }    @PostMapping("/{id}/create-invoice")
    public ResponseEntity<InvoiceResponse> createInvoiceFromOrder(@PathVariable Long id) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Create invoice from order request - orderId: {}, userId: {}, username: {}, ip: {}", 
                id, currentUserId, currentUsername, clientIp);
        
        securityLogger.info("SALES_CREATE_INVOICE_FROM_ORDER_REQUEST - User: {} (ID: {}), IP: {}, OrderId: {}, Action: CREATE_INVOICE_FROM_ORDER", 
                currentUsername, currentUserId, clientIp, id);
        
        try {
            // Validate order ID
            if (id == null || id <= 0) {
                logger.warn("Invalid order ID for invoice creation: {} - userId: {}, ip: {}", 
                        id, currentUserId, clientIp);
                securityLogger.warn("INVALID_ORDER_ID_FOR_INVOICE - User: {} (ID: {}), IP: {}, InvalidOrderId: {}", 
                        currentUsername, currentUserId, clientIp, id);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_CREATE,
                        "Invalid order ID for invoice creation: " + id,
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            // Validate path parameter for security
            validateInputSecurity(String.valueOf(id), clientIp);
            
            InvoiceResponse invoice = orderService.createInvoiceFromOrder(id);
            
            logger.info("Invoice created from order successfully - orderId: {}, invoiceId: {}, userId: {}, ip: {}", 
                    id, invoice.getId(), currentUserId, clientIp);
            
            securityLogger.info("SALES_INVOICE_CREATED_FROM_ORDER - User: {} (ID: {}), IP: {}, OrderId: {}, InvoiceId: {}", 
                    currentUsername, currentUserId, clientIp, id, invoice.getId());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "Created invoice from order - OrderId: " + id + ", InvoiceId: " + invoice.getId(),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(invoice);
            
        } catch (Exception e) {
            logger.error("Error creating invoice from order {} - userId: {}, username: {}, ip: {}", 
                    id, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_CREATE_INVOICE_FROM_ORDER_ERROR - User: {} (ID: {}), IP: {}, OrderId: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, id, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "Failed to create invoice from order " + id + ": " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }    }

    // Security and utility helper methods
    
    private Long getCurrentUserIdSafely() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getName())) {
                // Use getUserByEmail since we don't have getCurrentUserId
                return userService.getUserByEmail(authentication.getName()).getId();
            }
        } catch (Exception e) {
            logger.debug("Error getting current user ID: {}", e.getMessage());
        }
        return null;
    }

    private String getCurrentUsernameSafely() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getName())) {
                return authentication.getName();
            }
        } catch (Exception e) {
            logger.debug("Error getting current username: {}", e.getMessage());
        }
        return "anonymous";
    }

    private String getClientIpSafely() {
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
            HttpServletRequest request = attrs.getRequest();
            
            String xForwardedFor = request.getHeader("X-Forwarded-For");
            if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
                return xForwardedFor.split(",")[0].trim();
            }
            
            String xRealIp = request.getHeader("X-Real-IP");
            if (xRealIp != null && !xRealIp.isEmpty()) {
                return xRealIp;
            }
            
            return request.getRemoteAddr();
        } catch (Exception e) {
            logger.debug("Error getting client IP: {}", e.getMessage());
            return "unknown";
        }
    }

    private void validateInputSecurity(String input, String clientIp) {
        if (input == null) return;
        
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        if (containsSqlInjectionPatterns(input)) {
            securityLogger.warn("SQL_INJECTION_ATTEMPT - User: {} (ID: {}), IP: {}, Input: {}", 
                    currentUsername, currentUserId, clientIp, input);
            logService.createLog(
                    AppConstants.LOG_ACTION_SECURITY,
                    "SQL injection attempt detected: " + input,
                    clientIp,
                    AppConstants.LOG_TYPE_SECURITY,
                    currentUserId);
            throw new SecurityException("Invalid input detected");
        }
        
        if (containsXssPatterns(input)) {
            securityLogger.warn("XSS_ATTEMPT - User: {} (ID: {}), IP: {}, Input: {}", 
                    currentUsername, currentUserId, clientIp, input);            
            logService.createLog(
                    AppConstants.LOG_ACTION_SECURITY,
                    "XSS attempt detected: " + input,
                    clientIp,
                    AppConstants.LOG_TYPE_SECURITY,
                    currentUserId);
            throw new SecurityException("Invalid input detected");
        }
        
        if (containsPathTraversalPatterns(input)) {
            securityLogger.warn("PATH_TRAVERSAL_ATTEMPT - User: {} (ID: {}), IP: {}, Input: {}", 
                    currentUsername, currentUserId, clientIp, input);
            logService.createLog(
                    AppConstants.LOG_ACTION_SECURITY,
                    "Path traversal attempt detected: " + input,
                    clientIp,
                    AppConstants.LOG_TYPE_SECURITY,
                    currentUserId);            throw new SecurityException("Invalid input detected");
        }
    }

    private boolean containsSqlInjectionPatterns(String input) {
        if (input == null) return false;
        String lowerInput = input.toLowerCase();
        return lowerInput.contains("union") || lowerInput.contains("select") || 
               lowerInput.contains("insert") || lowerInput.contains("update") || 
               lowerInput.contains("delete") || lowerInput.contains("drop") ||
               lowerInput.contains("create") || lowerInput.contains("alter") ||
               lowerInput.contains("--") || lowerInput.contains("/*") ||
               lowerInput.contains("*/") || lowerInput.contains("xp_") ||
               lowerInput.contains("sp_") || lowerInput.contains("exec");
    }

    private boolean containsXssPatterns(String input) {
        if (input == null) return false;
        String lowerInput = input.toLowerCase();
        return lowerInput.contains("<script") || lowerInput.contains("javascript:") ||
               lowerInput.contains("vbscript:") || lowerInput.contains("onload") ||
               lowerInput.contains("onerror") || lowerInput.contains("onclick") ||
               lowerInput.contains("onmouseover") || lowerInput.contains("onfocus") ||
               lowerInput.contains("onblur") || lowerInput.contains("onchange") ||
               lowerInput.contains("onsubmit") || lowerInput.contains("iframe") ||
               lowerInput.contains("object") || lowerInput.contains("embed") ||
               lowerInput.contains("applet");
    }

    private boolean containsPathTraversalPatterns(String input) {
        if (input == null) return false;
        return input.contains("../") || input.contains("..\\") ||
               input.contains("./") || input.contains(".\\") ||
               input.contains("~") || input.contains("%2e%2e") ||
               input.contains("%2f") || input.contains("%5c");
    }
}