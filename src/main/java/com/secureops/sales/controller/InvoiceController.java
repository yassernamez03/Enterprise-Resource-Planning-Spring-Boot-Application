package com.secureops.sales.controller;

import com.secureops.sales.dto.request.InvoiceRequest;
import com.secureops.sales.dto.response.InvoiceResponse;
import com.secureops.sales.entity.InvoiceStatus;
import com.secureops.sales.service.InvoiceService;
import com.secureops.service.LogService;
import com.secureops.service.UserService;
import com.secureops.util.AppConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/sales/invoices")
public class InvoiceController {

    private static final Logger logger = LoggerFactory.getLogger(InvoiceController.class);
    private static final Logger securityLogger = LoggerFactory.getLogger("com.secureops.security");

    private final InvoiceService invoiceService;
    private final LogService logService;
    private final UserService userService;

    @Autowired
    public InvoiceController(InvoiceService invoiceService, LogService logService, UserService userService) {
        this.invoiceService = invoiceService;
        this.logService = logService;
        this.userService = userService;
        logger.info("InvoiceController initialized");
    }    @GetMapping
    public ResponseEntity<List<InvoiceResponse>> getAllInvoices() {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("All invoices retrieval request - userId: {}, username: {}, ip: {}", 
                currentUserId, currentUsername, clientIp);
        
        securityLogger.info("SALES_INVOICES_LIST_ACCESS - User: {} (ID: {}), IP: {}, Action: VIEW_ALL_INVOICES", 
                currentUsername, currentUserId, clientIp);
        
        try {
            List<InvoiceResponse> invoices = invoiceService.getAllInvoices();
            
            logger.info("All invoices retrieved successfully - count: {}, userId: {}, ip: {}", 
                    invoices.size(), currentUserId, clientIp);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Retrieved invoices list - count: " + invoices.size(),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(invoices);
            
        } catch (Exception e) {
            logger.error("Error retrieving invoices - userId: {}, username: {}, ip: {}", 
                    currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_INVOICES_LIST_ERROR - User: {} (ID: {}), IP: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve invoices list: " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }
    }    @GetMapping("/{id}")
    public ResponseEntity<InvoiceResponse> getInvoiceById(@PathVariable Long id) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Invoice by ID retrieval request - invoiceId: {}, userId: {}, username: {}, ip: {}", 
                id, currentUserId, currentUsername, clientIp);
        
        securityLogger.info("SALES_INVOICE_DETAIL_ACCESS - User: {} (ID: {}), IP: {}, InvoiceId: {}, Action: VIEW_INVOICE_DETAILS", 
                currentUsername, currentUserId, clientIp, id);
        
        try {
            // Validate input parameters
            if (id == null || id <= 0) {
                logger.warn("Invalid invoice ID parameter: {} - userId: {}, ip: {}", 
                        id, currentUserId, clientIp);
                securityLogger.warn("INVALID_INVOICE_ID_PARAMETER - User: {} (ID: {}), IP: {}, InvalidId: {}", 
                        currentUsername, currentUserId, clientIp, id);
                return ResponseEntity.badRequest().build();
            }
            
            // Validate path parameter for security
            validateInputSecurity(String.valueOf(id), clientIp);
            
            InvoiceResponse invoice = invoiceService.getInvoiceById(id);
            
            logger.info("Invoice retrieved successfully - invoiceId: {}, invoiceNumber: {}, userId: {}, ip: {}", 
                    id, invoice.getInvoiceNumber(), currentUserId, clientIp);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Retrieved invoice details - ID: " + id + ", Number: " + invoice.getInvoiceNumber(),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(invoice);
            
        } catch (Exception e) {
            logger.error("Error retrieving invoice {} - userId: {}, username: {}, ip: {}", 
                    id, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_INVOICE_DETAIL_ERROR - User: {} (ID: {}), IP: {}, InvoiceId: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, id, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve invoice " + id + ": " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }
    }    @GetMapping("/number/{invoiceNumber}")
    public ResponseEntity<InvoiceResponse> getInvoiceByNumber(@PathVariable String invoiceNumber) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Invoice by number retrieval request - invoiceNumber: {}, userId: {}, username: {}, ip: {}", 
                invoiceNumber, currentUserId, currentUsername, clientIp);
        
        securityLogger.info("SALES_INVOICE_BY_NUMBER_ACCESS - User: {} (ID: {}), IP: {}, InvoiceNumber: {}, Action: VIEW_INVOICE_BY_NUMBER", 
                currentUsername, currentUserId, clientIp, invoiceNumber);
        
        try {
            // Validate invoice number
            if (invoiceNumber == null || invoiceNumber.trim().isEmpty()) {
                logger.warn("Invalid invoice number parameter: {} - userId: {}, ip: {}", 
                        invoiceNumber, currentUserId, clientIp);
                securityLogger.warn("INVALID_INVOICE_NUMBER_PARAMETER - User: {} (ID: {}), IP: {}, InvalidInvoiceNumber: {}", 
                        currentUsername, currentUserId, clientIp, invoiceNumber);
                return ResponseEntity.badRequest().build();
            }
            
            // Validate path parameter for security
            validateInputSecurity(invoiceNumber, clientIp);
            
            InvoiceResponse invoice = invoiceService.getInvoiceByNumber(invoiceNumber);
            
            logger.info("Invoice by number retrieved successfully - invoiceNumber: {}, invoiceId: {}, userId: {}, ip: {}", 
                    invoiceNumber, invoice.getId(), currentUserId, clientIp);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Retrieved invoice by number - Number: " + invoiceNumber + ", ID: " + invoice.getId(),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(invoice);
            
        } catch (Exception e) {
            logger.error("Error retrieving invoice by number {} - userId: {}, username: {}, ip: {}", 
                    invoiceNumber, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_INVOICE_BY_NUMBER_ERROR - User: {} (ID: {}), IP: {}, InvoiceNumber: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, invoiceNumber, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve invoice by number " + invoiceNumber + ": " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }
    }    @PostMapping("/create")
    public ResponseEntity<InvoiceResponse> createInvoice(@Valid @RequestBody InvoiceRequest request) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Invoice creation request - userId: {}, username: {}, ip: {}", 
                currentUserId, currentUsername, clientIp);
        
        securityLogger.info("SALES_INVOICE_CREATE_REQUEST - User: {} (ID: {}), IP: {}, Action: CREATE_INVOICE", 
                currentUsername, currentUserId, clientIp);
          try {
            // Validate input security for key fields
            if (request.getNotes() != null) {
                validateInputSecurity(request.getNotes(), clientIp);
            }
            
            InvoiceResponse createdInvoice = invoiceService.createInvoice(request);
            
            logger.info("Invoice created successfully - invoiceId: {}, invoiceNumber: {}, userId: {}, ip: {}", 
                    createdInvoice.getId(), createdInvoice.getInvoiceNumber(), currentUserId, clientIp);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "Created invoice - ID: " + createdInvoice.getId() + ", Number: " + createdInvoice.getInvoiceNumber(),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return new ResponseEntity<>(createdInvoice, HttpStatus.CREATED);
            
        } catch (Exception e) {
            logger.error("Error creating invoice - userId: {}, username: {}, ip: {}", 
                    currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_INVOICE_CREATE_ERROR - User: {} (ID: {}), IP: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "Failed to create invoice: " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }
    }    @PutMapping("/update/{id}")
    public ResponseEntity<InvoiceResponse> updateInvoice(@PathVariable Long id, @Valid @RequestBody InvoiceRequest request) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Invoice update request - invoiceId: {}, userId: {}, username: {}, ip: {}", 
                id, currentUserId, currentUsername, clientIp);
        
        securityLogger.info("SALES_INVOICE_UPDATE_REQUEST - User: {} (ID: {}), IP: {}, InvoiceId: {}, Action: UPDATE_INVOICE", 
                currentUsername, currentUserId, clientIp, id);
        
        try {
            // Validate input parameters
            if (id == null || id <= 0) {
                logger.warn("Invalid invoice ID parameter: {} - userId: {}, ip: {}", 
                        id, currentUserId, clientIp);
                securityLogger.warn("INVALID_INVOICE_ID_PARAMETER - User: {} (ID: {}), IP: {}, InvalidId: {}", 
                        currentUsername, currentUserId, clientIp, id);
                return ResponseEntity.badRequest().build();
            }
              // Validate path parameter for security
            validateInputSecurity(String.valueOf(id), clientIp);
            
            // Validate input security for key fields
            if (request.getNotes() != null) {
                validateInputSecurity(request.getNotes(), clientIp);
            }
            
            InvoiceResponse updatedInvoice = invoiceService.updateInvoice(id, request);
            
            logger.info("Invoice updated successfully - invoiceId: {}, invoiceNumber: {}, userId: {}, ip: {}", 
                    id, updatedInvoice.getInvoiceNumber(), currentUserId, clientIp);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_UPDATE,
                    "Updated invoice - ID: " + id + ", Number: " + updatedInvoice.getInvoiceNumber(),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(updatedInvoice);
            
        } catch (Exception e) {
            logger.error("Error updating invoice {} - userId: {}, username: {}, ip: {}", 
                    id, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_INVOICE_UPDATE_ERROR - User: {} (ID: {}), IP: {}, InvoiceId: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, id, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_UPDATE,
                    "Failed to update invoice " + id + ": " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }
    }    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteInvoice(@PathVariable Long id) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Invoice deletion request - invoiceId: {}, userId: {}, username: {}, ip: {}", 
                id, currentUserId, currentUsername, clientIp);
        
        securityLogger.info("SALES_INVOICE_DELETE_REQUEST - User: {} (ID: {}), IP: {}, InvoiceId: {}, Action: DELETE_INVOICE", 
                currentUsername, currentUserId, clientIp, id);
        
        try {
            // Validate input parameters
            if (id == null || id <= 0) {
                logger.warn("Invalid invoice ID parameter: {} - userId: {}, ip: {}", 
                        id, currentUserId, clientIp);
                securityLogger.warn("INVALID_INVOICE_ID_PARAMETER - User: {} (ID: {}), IP: {}, InvalidId: {}", 
                        currentUsername, currentUserId, clientIp, id);
                return ResponseEntity.badRequest().build();
            }
            
            // Validate path parameter for security
            validateInputSecurity(String.valueOf(id), clientIp);
            
            invoiceService.deleteInvoice(id);
            
            logger.info("Invoice deleted successfully - invoiceId: {}, userId: {}, ip: {}", 
                    id, currentUserId, clientIp);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_DELETE,
                    "Deleted invoice - ID: " + id,
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.noContent().build();
            
        } catch (Exception e) {
            logger.error("Error deleting invoice {} - userId: {}, username: {}, ip: {}", 
                    id, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_INVOICE_DELETE_ERROR - User: {} (ID: {}), IP: {}, InvoiceId: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, id, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_DELETE,
                    "Failed to delete invoice " + id + ": " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }
    }    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<InvoiceResponse>> getInvoicesByClient(@PathVariable Long clientId) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Invoices by client request - clientId: {}, userId: {}, username: {}, ip: {}", 
                clientId, currentUserId, currentUsername, clientIp);
        
        securityLogger.info("SALES_INVOICES_BY_CLIENT - User: {} (ID: {}), IP: {}, ClientId: {}, Action: VIEW_INVOICES_BY_CLIENT", 
                currentUsername, currentUserId, clientIp, clientId);
        
        try {
            // Validate input parameters
            if (clientId == null || clientId <= 0) {
                logger.warn("Invalid client ID parameter: {} - userId: {}, ip: {}", 
                        clientId, currentUserId, clientIp);
                securityLogger.warn("INVALID_CLIENT_ID_PARAMETER - User: {} (ID: {}), IP: {}, InvalidClientId: {}", 
                        currentUsername, currentUserId, clientIp, clientId);
                return ResponseEntity.badRequest().build();
            }
            
            // Validate path parameter for security
            validateInputSecurity(String.valueOf(clientId), clientIp);
            
            List<InvoiceResponse> invoices = invoiceService.getInvoicesByClient(clientId);
            
            logger.info("Invoices by client retrieved successfully - clientId: {}, count: {}, userId: {}, ip: {}", 
                    clientId, invoices.size(), currentUserId, clientIp);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Retrieved invoices by client - ClientId: " + clientId + ", Count: " + invoices.size(),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(invoices);
            
        } catch (Exception e) {
            logger.error("Error retrieving invoices by client {} - userId: {}, username: {}, ip: {}", 
                    clientId, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_INVOICES_BY_CLIENT_ERROR - User: {} (ID: {}), IP: {}, ClientId: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, clientId, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve invoices by client " + clientId + ": " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<InvoiceResponse>> getInvoicesByStatus(@PathVariable InvoiceStatus status) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Invoices by status request - status: {}, userId: {}, username: {}, ip: {}", 
                status, currentUserId, currentUsername, clientIp);
        
        securityLogger.info("SALES_INVOICES_BY_STATUS - User: {} (ID: {}), IP: {}, Status: {}, Action: VIEW_INVOICES_BY_STATUS", 
                currentUsername, currentUserId, clientIp, status);
        
        try {
            // Validate input parameters
            if (status == null) {
                logger.warn("Invalid status parameter: {} - userId: {}, ip: {}", 
                        status, currentUserId, clientIp);
                securityLogger.warn("INVALID_STATUS_PARAMETER - User: {} (ID: {}), IP: {}, InvalidStatus: {}", 
                        currentUsername, currentUserId, clientIp, status);
                return ResponseEntity.badRequest().build();
            }
            
            List<InvoiceResponse> invoices = invoiceService.getInvoicesByStatus(status);
            
            logger.info("Invoices by status retrieved successfully - status: {}, count: {}, userId: {}, ip: {}", 
                    status, invoices.size(), currentUserId, clientIp);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Retrieved invoices by status - Status: " + status + ", Count: " + invoices.size(),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(invoices);
            
        } catch (Exception e) {
            logger.error("Error retrieving invoices by status {} - userId: {}, username: {}, ip: {}", 
                    status, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_INVOICES_BY_STATUS_ERROR - User: {} (ID: {}), IP: {}, Status: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, status, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve invoices by status " + status + ": " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }
    }    @GetMapping("/date-range")
    public ResponseEntity<List<InvoiceResponse>> getInvoicesByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Invoices by date range request - startDate: {}, endDate: {}, userId: {}, username: {}, ip: {}", 
                startDate, endDate, currentUserId, currentUsername, clientIp);
        
        securityLogger.info("SALES_INVOICES_BY_DATE_RANGE - User: {} (ID: {}), IP: {}, StartDate: {}, EndDate: {}, Action: VIEW_INVOICES_BY_DATE_RANGE", 
                currentUsername, currentUserId, clientIp, startDate, endDate);
        
        try {
            // Validate input parameters
            if (startDate == null || endDate == null) {
                logger.warn("Invalid date parameters - startDate: {}, endDate: {}, userId: {}, ip: {}", 
                        startDate, endDate, currentUserId, clientIp);
                securityLogger.warn("INVALID_DATE_PARAMETERS - User: {} (ID: {}), IP: {}, StartDate: {}, EndDate: {}", 
                        currentUsername, currentUserId, clientIp, startDate, endDate);
                return ResponseEntity.badRequest().build();
            }
            
            if (startDate.isAfter(endDate)) {
                logger.warn("Invalid date range - startDate after endDate: {} > {}, userId: {}, ip: {}", 
                        startDate, endDate, currentUserId, clientIp);
                securityLogger.warn("INVALID_DATE_RANGE - User: {} (ID: {}), IP: {}, StartDate: {}, EndDate: {}", 
                        currentUsername, currentUserId, clientIp, startDate, endDate);
                return ResponseEntity.badRequest().build();
            }
            
            List<InvoiceResponse> invoices = invoiceService.getInvoicesByDateRange(startDate, endDate);
            
            logger.info("Invoices by date range retrieved successfully - count: {}, userId: {}, ip: {}", 
                    invoices.size(), currentUserId, clientIp);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Retrieved invoices by date range - StartDate: " + startDate + ", EndDate: " + endDate + ", Count: " + invoices.size(),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(invoices);
            
        } catch (Exception e) {
            logger.error("Error retrieving invoices by date range - startDate: {}, endDate: {}, userId: {}, username: {}, ip: {}", 
                    startDate, endDate, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_INVOICES_BY_DATE_RANGE_ERROR - User: {} (ID: {}), IP: {}, StartDate: {}, EndDate: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, startDate, endDate, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve invoices by date range " + startDate + " to " + endDate + ": " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/{id}/mark-as-paid")
    public ResponseEntity<InvoiceResponse> markInvoiceAsPaid(
            @PathVariable Long id,
            @RequestParam String paymentMethod) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Mark invoice as paid request - invoiceId: {}, paymentMethod: {}, userId: {}, username: {}, ip: {}", 
                id, paymentMethod, currentUserId, currentUsername, clientIp);
        
        securityLogger.info("SALES_INVOICE_MARK_PAID - User: {} (ID: {}), IP: {}, InvoiceId: {}, PaymentMethod: {}, Action: MARK_INVOICE_PAID", 
                currentUsername, currentUserId, clientIp, id, paymentMethod);
        
        try {
            // Validate input parameters
            if (id == null || id <= 0) {
                logger.warn("Invalid invoice ID parameter: {} - userId: {}, ip: {}", 
                        id, currentUserId, clientIp);
                securityLogger.warn("INVALID_INVOICE_ID_PARAMETER - User: {} (ID: {}), IP: {}, InvalidId: {}", 
                        currentUsername, currentUserId, clientIp, id);
                return ResponseEntity.badRequest().build();
            }
            
            if (paymentMethod == null || paymentMethod.trim().isEmpty()) {
                logger.warn("Invalid payment method parameter: {} - userId: {}, ip: {}", 
                        paymentMethod, currentUserId, clientIp);
                securityLogger.warn("INVALID_PAYMENT_METHOD_PARAMETER - User: {} (ID: {}), IP: {}, InvalidPaymentMethod: {}", 
                        currentUsername, currentUserId, clientIp, paymentMethod);
                return ResponseEntity.badRequest().build();
            }
            
            // Validate input security
            validateInputSecurity(String.valueOf(id), clientIp);
            validateInputSecurity(paymentMethod, clientIp);
            
            InvoiceResponse paidInvoice = invoiceService.markInvoiceAsPaid(id, paymentMethod);
            
            logger.info("Invoice marked as paid successfully - invoiceId: {}, invoiceNumber: {}, paymentMethod: {}, userId: {}, ip: {}", 
                    id, paidInvoice.getInvoiceNumber(), paymentMethod, currentUserId, clientIp);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_UPDATE,
                    "Marked invoice as paid - ID: " + id + ", Number: " + paidInvoice.getInvoiceNumber() + ", PaymentMethod: " + paymentMethod,
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(paidInvoice);
            
        } catch (Exception e) {
            logger.error("Error marking invoice {} as paid - paymentMethod: {}, userId: {}, username: {}, ip: {}", 
                    id, paymentMethod, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_INVOICE_MARK_PAID_ERROR - User: {} (ID: {}), IP: {}, InvoiceId: {}, PaymentMethod: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, id, paymentMethod, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_UPDATE,
                    "Failed to mark invoice " + id + " as paid with method " + paymentMethod + ": " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }
    }
    
    // Security and utility helper methods
    
    private Long getCurrentUserIdSafely() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() && 
                !authentication.getName().equals("anonymousUser")) {
                return userService.getUserByEmail(authentication.getName()).getId();
            }
        } catch (Exception e) {
            logger.warn("Error getting current user ID: {}", e.getMessage());
        }
        return null;
    }
    
    private String getCurrentUsernameSafely() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() && 
                !authentication.getName().equals("anonymousUser")) {
                return authentication.getName();
            }
        } catch (Exception e) {
            logger.warn("Error getting current username: {}", e.getMessage());
        }
        return "unknown";
    }
    
    private String getClientIpSafely() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
            HttpServletRequest request = attributes.getRequest();
            
            String xForwardedFor = request.getHeader("X-Forwarded-For");
            if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
                return xForwardedFor.split(",")[0].trim();
            }
            
            String xRealIp = request.getHeader("X-Real-IP");
            if (xRealIp != null && !xRealIp.isEmpty()) {
                return xRealIp.trim();
            }
            
            return request.getRemoteAddr();
        } catch (Exception e) {
            logger.warn("Error getting client IP: {}", e.getMessage());
            return "unknown";
        }
    }
    
    private void validateInputSecurity(String input, String clientIp) {
        if (input == null) return;
        
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        // Check for SQL injection patterns
        if (containsSqlInjectionPattern(input)) {
            securityLogger.error("SQL_INJECTION_ATTEMPT - User: {} (ID: {}), IP: {}, Input: {}", 
                    currentUsername, currentUserId, clientIp, sanitizeForLogging(input));
            
            logService.createLog(
                    AppConstants.LOG_ACTION_SECURITY,
                    "SQL injection attempt detected: " + sanitizeForLogging(input),
                    clientIp,
                    AppConstants.LOG_TYPE_SECURITY,
                    currentUserId);
            
            throw new SecurityException("Invalid input detected");
        }
        
        // Check for XSS patterns
        if (containsXssPattern(input)) {
            securityLogger.error("XSS_ATTEMPT - User: {} (ID: {}), IP: {}, Input: {}", 
                    currentUsername, currentUserId, clientIp, sanitizeForLogging(input));
            
            logService.createLog(
                    AppConstants.LOG_ACTION_SECURITY,
                    "XSS attempt detected: " + sanitizeForLogging(input),
                    clientIp,
                    AppConstants.LOG_TYPE_SECURITY,
                    currentUserId);
            
            throw new SecurityException("Invalid input detected");
        }
        
        // Check for path traversal patterns
        if (containsPathTraversalPattern(input)) {
            securityLogger.error("PATH_TRAVERSAL_ATTEMPT - User: {} (ID: {}), IP: {}, Input: {}", 
                    currentUsername, currentUserId, clientIp, sanitizeForLogging(input));
            
            logService.createLog(
                    AppConstants.LOG_ACTION_SECURITY,
                    "Path traversal attempt detected: " + sanitizeForLogging(input),
                    clientIp,
                    AppConstants.LOG_TYPE_SECURITY,
                    currentUserId);
            
            throw new SecurityException("Invalid input detected");
        }
    }
    
    private boolean containsSqlInjectionPattern(String input) {
        if (input == null) return false;
        String lowerInput = input.toLowerCase();
        String[] sqlPatterns = {
            "union select", "drop table", "delete from", "insert into", 
            "update set", "create table", "alter table", "exec ", "execute",
            "--", "/*", "*/", "xp_", "sp_", "waitfor delay"
        };
        
        for (String pattern : sqlPatterns) {
            if (lowerInput.contains(pattern)) {
                return true;
            }
        }
        return false;
    }
    
    private boolean containsXssPattern(String input) {
        if (input == null) return false;
        String lowerInput = input.toLowerCase();
        String[] xssPatterns = {
            "<script", "</script>", "javascript:", "onload=", "onerror=", 
            "onclick=", "onmouseover=", "onfocus=", "onblur=", "onchange=",
            "eval(", "expression(", "vbscript:", "data:text/html"
        };
        
        for (String pattern : xssPatterns) {
            if (lowerInput.contains(pattern)) {
                return true;
            }
        }
        return false;
    }
    
    private boolean containsPathTraversalPattern(String input) {
        if (input == null) return false;
        String[] pathPatterns = {
            "../", "..\\", "..%2f", "..%5c", "%2e%2e%2f", "%2e%2e%5c",
            "....//", "....\\\\", "/etc/passwd", "\\windows\\system32"
        };
        
        String lowerInput = input.toLowerCase();
        for (String pattern : pathPatterns) {
            if (lowerInput.contains(pattern)) {
                return true;
            }
        }
        return false;
    }
    
    private String sanitizeForLogging(String input) {
        if (input == null) return "null";
        return input.replaceAll("[\r\n\t]", "_")
                   .replaceAll("[<>\"'&]", "*")
                   .substring(0, Math.min(input.length(), 100));
    }
}