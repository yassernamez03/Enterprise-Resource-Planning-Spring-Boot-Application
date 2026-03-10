package com.secureops.sales.controller;

import com.secureops.sales.dto.request.QuoteRequest;
import com.secureops.sales.dto.response.OrderResponse;
import com.secureops.sales.dto.response.QuoteResponse;
import com.secureops.sales.entity.QuoteStatus;
import com.secureops.sales.service.QuoteService;
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
@RequestMapping("/api/sales/quotes")
public class QuoteController {

    private static final Logger logger = LoggerFactory.getLogger(QuoteController.class);
    private static final Logger securityLogger = LoggerFactory.getLogger("com.secureops.security");

    private final QuoteService quoteService;
    private final LogService logService;
    private final UserService userService;

    @Autowired
    public QuoteController(QuoteService quoteService, LogService logService, UserService userService) {
        this.quoteService = quoteService;
        this.logService = logService;
        this.userService = userService;
        logger.info("QuoteController initialized");
    }

    @GetMapping
    public ResponseEntity<Page<QuoteResponse>> getAllQuotes(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size){
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("All quotes retrieval request - userId: {}, username: {}, page: {}, size: {}, ip: {}", 
                currentUserId, currentUsername, page, size, clientIp);
        
        securityLogger.info("SALES_QUOTES_LIST_ACCESS - User: {} (ID: {}), IP: {}, Action: VIEW_ALL_QUOTES", 
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
                        "Invalid pagination parameters for quotes list - page: " + page + ", size: " + size,
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            Page<QuoteResponse> quotes = quoteService.getAllQuotes(page, size);
            
            logger.info("All quotes retrieved successfully - count: {}, userId: {}, ip: {}", 
                    quotes.getTotalElements(), currentUserId, clientIp);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Retrieved quotes list - page: " + page + ", size: " + size + ", total: " + quotes.getTotalElements(),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(quotes);
            
        } catch (Exception e) {
            logger.error("Error retrieving quotes - userId: {}, username: {}, ip: {}", 
                    currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_QUOTES_LIST_ERROR - User: {} (ID: {}), IP: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve quotes list: " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuoteResponse> getQuoteById(@PathVariable Long id) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Quote by ID retrieval request - quoteId: {}, userId: {}, username: {}, ip: {}", 
                id, currentUserId, currentUsername, clientIp);
        
        securityLogger.info("SALES_QUOTE_DETAIL_ACCESS - User: {} (ID: {}), IP: {}, QuoteId: {}, Action: VIEW_QUOTE", 
                currentUsername, currentUserId, clientIp, id);
        
        try {
            // Validate quote ID
            if (id == null || id <= 0) {
                logger.warn("Invalid quote ID parameter: {} - userId: {}, ip: {}", 
                        id, currentUserId, clientIp);
                securityLogger.warn("INVALID_QUOTE_ID_PARAMETER - User: {} (ID: {}), IP: {}, InvalidQuoteId: {}", 
                        currentUsername, currentUserId, clientIp, id);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_READ,
                        "Invalid quote ID parameter: " + id,
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            // Validate path parameter for security
            validateInputSecurity(String.valueOf(id), clientIp);
            
            QuoteResponse quote = quoteService.getQuoteById(id);
            
            logger.info("Quote retrieved successfully - quoteId: {}, quoteNumber: {}, userId: {}, ip: {}", 
                    id, quote.getQuoteNumber(), currentUserId, clientIp);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Retrieved quote details - ID: " + id + ", Number: " + quote.getQuoteNumber(),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(quote);
            
        } catch (Exception e) {
            logger.error("Error retrieving quote {} - userId: {}, username: {}, ip: {}", 
                    id, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_QUOTE_DETAIL_ERROR - User: {} (ID: {}), IP: {}, QuoteId: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, id, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve quote " + id + ": " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/number/{quoteNumber}")
    public ResponseEntity<QuoteResponse> getQuoteByNumber(@PathVariable String quoteNumber) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Quote by number retrieval request - quoteNumber: {}, userId: {}, username: {}, ip: {}", 
                quoteNumber, currentUserId, currentUsername, clientIp);
        
        securityLogger.info("SALES_QUOTE_BY_NUMBER_ACCESS - User: {} (ID: {}), IP: {}, QuoteNumber: {}, Action: VIEW_QUOTE_BY_NUMBER", 
                currentUsername, currentUserId, clientIp, quoteNumber);
        
        try {
            // Validate quote number
            if (quoteNumber == null || quoteNumber.trim().isEmpty()) {
                logger.warn("Invalid quote number parameter: {} - userId: {}, ip: {}", 
                        quoteNumber, currentUserId, clientIp);
                securityLogger.warn("INVALID_QUOTE_NUMBER_PARAMETER - User: {} (ID: {}), IP: {}, InvalidQuoteNumber: {}", 
                        currentUsername, currentUserId, clientIp, quoteNumber);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_READ,
                        "Invalid quote number parameter: " + quoteNumber,
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            // Validate path parameter for security
            validateInputSecurity(quoteNumber, clientIp);
            
            QuoteResponse quote = quoteService.getQuoteByNumber(quoteNumber);
            
            logger.info("Quote retrieved successfully by number - quoteNumber: {}, quoteId: {}, userId: {}, ip: {}", 
                    quoteNumber, quote.getId(), currentUserId, clientIp);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Retrieved quote by number - Number: " + quoteNumber + ", ID: " + quote.getId(),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(quote);
            
        } catch (Exception e) {
            logger.error("Error retrieving quote by number {} - userId: {}, username: {}, ip: {}", 
                    quoteNumber, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_QUOTE_BY_NUMBER_ERROR - User: {} (ID: {}), IP: {}, QuoteNumber: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, quoteNumber, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve quote by number " + quoteNumber + ": " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/create")
    public ResponseEntity<QuoteResponse> createQuote(@Valid @RequestBody QuoteRequest request, BindingResult bindingResult) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Quote creation request - userId: {}, username: {}, ip: {}", 
                currentUserId, currentUsername, clientIp);
        
        securityLogger.info("SALES_QUOTE_CREATE_REQUEST - User: {} (ID: {}), IP: {}, Action: CREATE_QUOTE", 
                currentUsername, currentUserId, clientIp);
        
        try {
            // Validate binding results
            if (bindingResult.hasErrors()) {
                logger.warn("Validation errors in quote creation - userId: {}, ip: {}, errors: {}", 
                        currentUserId, clientIp, bindingResult.getAllErrors());
                securityLogger.warn("QUOTE_VALIDATION_ERRORS - User: {} (ID: {}), IP: {}, Errors: {}", 
                        currentUsername, currentUserId, clientIp, bindingResult.getAllErrors());
                
                logService.createLog(
                        AppConstants.LOG_ACTION_CREATE,
                        "Quote creation validation errors: " + bindingResult.getAllErrors(),
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
              // Validate input security for key fields
            if (request.getNotes() != null) {
                validateInputSecurity(request.getNotes(), clientIp);
            }
            
            QuoteResponse createdQuote = quoteService.createQuote(request);
            
            logger.info("Quote created successfully - quoteId: {}, quoteNumber: {}, userId: {}, ip: {}", 
                    createdQuote.getId(), createdQuote.getQuoteNumber(), currentUserId, clientIp);
            
            securityLogger.info("SALES_QUOTE_CREATED - User: {} (ID: {}), IP: {}, QuoteId: {}, QuoteNumber: {}", 
                    currentUsername, currentUserId, clientIp, createdQuote.getId(), createdQuote.getQuoteNumber());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "Created new quote - ID: " + createdQuote.getId() + ", Number: " + createdQuote.getQuoteNumber(),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return new ResponseEntity<>(createdQuote, HttpStatus.CREATED);
            
        } catch (Exception e) {
            logger.error("Error creating quote - userId: {}, username: {}, ip: {}", 
                    currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_QUOTE_CREATE_ERROR - User: {} (ID: {}), IP: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "Failed to create quote: " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<QuoteResponse> updateQuote(@PathVariable Long id, @Valid @RequestBody QuoteRequest request, BindingResult bindingResult) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Quote update request - quoteId: {}, userId: {}, username: {}, ip: {}", 
                id, currentUserId, currentUsername, clientIp);
        
        securityLogger.info("SALES_QUOTE_UPDATE_REQUEST - User: {} (ID: {}), IP: {}, QuoteId: {}, Action: UPDATE_QUOTE", 
                currentUsername, currentUserId, clientIp, id);
        
        try {
            // Validate quote ID
            if (id == null || id <= 0) {
                logger.warn("Invalid quote ID parameter: {} - userId: {}, ip: {}", 
                        id, currentUserId, clientIp);
                securityLogger.warn("INVALID_QUOTE_ID_PARAMETER - User: {} (ID: {}), IP: {}, InvalidQuoteId: {}", 
                        currentUsername, currentUserId, clientIp, id);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_UPDATE,
                        "Invalid quote ID parameter: " + id,
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            // Validate binding results
            if (bindingResult.hasErrors()) {
                logger.warn("Validation errors in quote update - quoteId: {}, userId: {}, ip: {}, errors: {}", 
                        id, currentUserId, clientIp, bindingResult.getAllErrors());
                securityLogger.warn("QUOTE_UPDATE_VALIDATION_ERRORS - User: {} (ID: {}), IP: {}, QuoteId: {}, Errors: {}", 
                        currentUsername, currentUserId, clientIp, id, bindingResult.getAllErrors());
                
                logService.createLog(
                        AppConstants.LOG_ACTION_UPDATE,
                        "Quote update validation errors for ID " + id + ": " + bindingResult.getAllErrors(),
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
            
            QuoteResponse updatedQuote = quoteService.updateQuote(id, request);
            
            logger.info("Quote updated successfully - quoteId: {}, quoteNumber: {}, userId: {}, ip: {}", 
                    id, updatedQuote.getQuoteNumber(), currentUserId, clientIp);
            
            securityLogger.info("SALES_QUOTE_UPDATED - User: {} (ID: {}), IP: {}, QuoteId: {}, QuoteNumber: {}", 
                    currentUsername, currentUserId, clientIp, id, updatedQuote.getQuoteNumber());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_UPDATE,
                    "Updated quote - ID: " + id + ", Number: " + updatedQuote.getQuoteNumber(),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(updatedQuote);
            
        } catch (Exception e) {
            logger.error("Error updating quote {} - userId: {}, username: {}, ip: {}", 
                    id, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_QUOTE_UPDATE_ERROR - User: {} (ID: {}), IP: {}, QuoteId: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, id, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_UPDATE,
                    "Failed to update quote " + id + ": " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }
    }    @PutMapping("/{id}/status")
    public ResponseEntity<QuoteResponse> updateQuoteStatus(
            @PathVariable Long id,
            @RequestParam QuoteStatus status) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Quote status update request - quoteId: {}, status: {}, userId: {}, username: {}, ip: {}", 
                id, status, currentUserId, currentUsername, clientIp);
        
        securityLogger.info("SALES_QUOTE_STATUS_UPDATE - User: {} (ID: {}), IP: {}, QuoteId: {}, NewStatus: {}, Action: UPDATE_QUOTE_STATUS", 
                currentUsername, currentUserId, clientIp, id, status);
        
        try {
            // Validate input parameters
            if (id == null || id <= 0) {
                logger.warn("Invalid quote ID parameter: {} - userId: {}, ip: {}", 
                        id, currentUserId, clientIp);
                securityLogger.warn("INVALID_QUOTE_ID_PARAMETER - User: {} (ID: {}), IP: {}, InvalidId: {}", 
                        currentUsername, currentUserId, clientIp, id);
                return ResponseEntity.badRequest().build();
            }
            
            if (status == null) {
                logger.warn("Invalid status parameter: {} - userId: {}, ip: {}", 
                        status, currentUserId, clientIp);
                securityLogger.warn("INVALID_STATUS_PARAMETER - User: {} (ID: {}), IP: {}, InvalidStatus: {}", 
                        currentUsername, currentUserId, clientIp, status);
                return ResponseEntity.badRequest().build();
            }
            
            // Validate path parameter for security
            validateInputSecurity(String.valueOf(id), clientIp);
            
            QuoteResponse updatedQuote = quoteService.updateQuoteStatus(id, status);
            
            logger.info("Quote status updated successfully - quoteId: {}, newStatus: {}, quoteNumber: {}, userId: {}, ip: {}", 
                    id, status, updatedQuote.getQuoteNumber(), currentUserId, clientIp);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_UPDATE,
                    "Updated quote status - ID: " + id + ", Number: " + updatedQuote.getQuoteNumber() + ", Status: " + status,
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(updatedQuote);
            
        } catch (Exception e) {
            logger.error("Error updating quote status {} to {} - userId: {}, username: {}, ip: {}", 
                    id, status, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_QUOTE_STATUS_UPDATE_ERROR - User: {} (ID: {}), IP: {}, QuoteId: {}, Status: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, id, status, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_UPDATE,
                    "Failed to update quote status " + id + " to " + status + ": " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }
    }    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteQuote(@PathVariable Long id) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Quote deletion request - quoteId: {}, userId: {}, username: {}, ip: {}", 
                id, currentUserId, currentUsername, clientIp);
        
        securityLogger.info("SALES_QUOTE_DELETE_REQUEST - User: {} (ID: {}), IP: {}, QuoteId: {}, Action: DELETE_QUOTE", 
                currentUsername, currentUserId, clientIp, id);
        
        try {
            // Validate input parameters
            if (id == null || id <= 0) {
                logger.warn("Invalid quote ID parameter: {} - userId: {}, ip: {}", 
                        id, currentUserId, clientIp);
                securityLogger.warn("INVALID_QUOTE_ID_PARAMETER - User: {} (ID: {}), IP: {}, InvalidId: {}", 
                        currentUsername, currentUserId, clientIp, id);
                return ResponseEntity.badRequest().build();
            }
            
            // Validate path parameter for security
            validateInputSecurity(String.valueOf(id), clientIp);
            
            quoteService.deleteQuote(id);
            
            logger.info("Quote deleted successfully - quoteId: {}, userId: {}, ip: {}", 
                    id, currentUserId, clientIp);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_DELETE,
                    "Deleted quote - ID: " + id,
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.noContent().build();
            
        } catch (Exception e) {
            logger.error("Error deleting quote {} - userId: {}, username: {}, ip: {}", 
                    id, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_QUOTE_DELETE_ERROR - User: {} (ID: {}), IP: {}, QuoteId: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, id, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_DELETE,
                    "Failed to delete quote " + id + ": " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }
    }    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<QuoteResponse>> getQuotesByClient(@PathVariable Long clientId) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Quotes by client request - clientId: {}, userId: {}, username: {}, ip: {}", 
                clientId, currentUserId, currentUsername, clientIp);
        
        securityLogger.info("SALES_QUOTES_BY_CLIENT - User: {} (ID: {}), IP: {}, ClientId: {}, Action: VIEW_QUOTES_BY_CLIENT", 
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
            
            List<QuoteResponse> quotes = quoteService.getQuotesByClient(clientId);
            
            logger.info("Quotes by client retrieved successfully - clientId: {}, count: {}, userId: {}, ip: {}", 
                    clientId, quotes.size(), currentUserId, clientIp);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Retrieved quotes by client - ClientId: " + clientId + ", Count: " + quotes.size(),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(quotes);
            
        } catch (Exception e) {
            logger.error("Error retrieving quotes by client {} - userId: {}, username: {}, ip: {}", 
                    clientId, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_QUOTES_BY_CLIENT_ERROR - User: {} (ID: {}), IP: {}, ClientId: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, clientId, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve quotes by client " + clientId + ": " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }
    }    @GetMapping("/status/{status}")
    public ResponseEntity<List<QuoteResponse>> getQuotesByStatus(@PathVariable QuoteStatus status) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Quotes by status request - status: {}, userId: {}, username: {}, ip: {}", 
                status, currentUserId, currentUsername, clientIp);
        
        securityLogger.info("SALES_QUOTES_BY_STATUS - User: {} (ID: {}), IP: {}, Status: {}, Action: VIEW_QUOTES_BY_STATUS", 
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
            
            List<QuoteResponse> quotes = quoteService.getQuotesByStatus(status);
            
            logger.info("Quotes by status retrieved successfully - status: {}, count: {}, userId: {}, ip: {}", 
                    status, quotes.size(), currentUserId, clientIp);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Retrieved quotes by status - Status: " + status + ", Count: " + quotes.size(),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(quotes);
            
        } catch (Exception e) {
            logger.error("Error retrieving quotes by status {} - userId: {}, username: {}, ip: {}", 
                    status, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_QUOTES_BY_STATUS_ERROR - User: {} (ID: {}), IP: {}, Status: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, status, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve quotes by status " + status + ": " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }
    }    @GetMapping("/date-range")
    public ResponseEntity<List<QuoteResponse>> getQuotesByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Quotes by date range request - startDate: {}, endDate: {}, userId: {}, username: {}, ip: {}", 
                startDate, endDate, currentUserId, currentUsername, clientIp);
        
        securityLogger.info("SALES_QUOTES_BY_DATE_RANGE - User: {} (ID: {}), IP: {}, StartDate: {}, EndDate: {}, Action: VIEW_QUOTES_BY_DATE_RANGE", 
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
            
            List<QuoteResponse> quotes = quoteService.getQuotesByDateRange(startDate, endDate);
            
            logger.info("Quotes by date range retrieved successfully - count: {}, userId: {}, ip: {}", 
                    quotes.size(), currentUserId, clientIp);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Retrieved quotes by date range - StartDate: " + startDate + ", EndDate: " + endDate + ", Count: " + quotes.size(),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(quotes);
            
        } catch (Exception e) {
            logger.error("Error retrieving quotes by date range - startDate: {}, endDate: {}, userId: {}, username: {}, ip: {}", 
                    startDate, endDate, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_QUOTES_BY_DATE_RANGE_ERROR - User: {} (ID: {}), IP: {}, StartDate: {}, EndDate: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, startDate, endDate, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve quotes by date range " + startDate + " to " + endDate + ": " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }
    }    @PostMapping("/{id}/convert")
    public ResponseEntity<OrderResponse> convertQuoteToOrder(@PathVariable Long id) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Quote to order conversion request - quoteId: {}, userId: {}, username: {}, ip: {}", 
                id, currentUserId, currentUsername, clientIp);
        
        securityLogger.info("SALES_QUOTE_CONVERT_TO_ORDER - User: {} (ID: {}), IP: {}, QuoteId: {}, Action: CONVERT_QUOTE_TO_ORDER", 
                currentUsername, currentUserId, clientIp, id);
        
        try {
            // Validate input parameters
            if (id == null || id <= 0) {
                logger.warn("Invalid quote ID parameter: {} - userId: {}, ip: {}", 
                        id, currentUserId, clientIp);
                securityLogger.warn("INVALID_QUOTE_ID_PARAMETER - User: {} (ID: {}), IP: {}, InvalidId: {}", 
                        currentUsername, currentUserId, clientIp, id);
                return ResponseEntity.badRequest().build();
            }
            
            // Validate path parameter for security
            validateInputSecurity(String.valueOf(id), clientIp);
            
            OrderResponse convertedOrder = quoteService.convertQuoteToOrder(id);
            
            logger.info("Quote converted to order successfully - quoteId: {}, orderId: {}, orderNumber: {}, userId: {}, ip: {}", 
                    id, convertedOrder.getId(), convertedOrder.getOrderNumber(), currentUserId, clientIp);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "Converted quote to order - QuoteId: " + id + ", OrderId: " + convertedOrder.getId() + ", OrderNumber: " + convertedOrder.getOrderNumber(),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(convertedOrder);
            
        } catch (Exception e) {
            logger.error("Error converting quote {} to order - userId: {}, username: {}, ip: {}", 
                    id, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_QUOTE_CONVERT_TO_ORDER_ERROR - User: {} (ID: {}), IP: {}, QuoteId: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, id, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "Failed to convert quote " + id + " to order: " + e.getMessage(),
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
            logger.debug("Error getting current user ID", e);
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
            logger.debug("Error getting current username", e);
        }
        return "anonymous";
    }
    
    private String getClientIpSafely() {
        try {
            HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes())
                    .getRequest();
            
            String[] headers = {"X-Forwarded-For", "Proxy-Client-IP", "WL-Proxy-Client-IP", 
                              "HTTP_X_FORWARDED_FOR", "HTTP_X_FORWARDED", "HTTP_X_CLUSTER_CLIENT_IP", 
                              "HTTP_CLIENT_IP", "HTTP_FORWARDED_FOR", "HTTP_FORWARDED", "HTTP_VIA", 
                              "REMOTE_ADDR"};
            
            for (String header : headers) {
                String ipAddress = request.getHeader(header);
                if (isValidIpAddress(ipAddress)) {
                    if (ipAddress.contains(",")) {
                        ipAddress = ipAddress.split(",")[0].trim();
                    }
                    return ipAddress;
                }
            }
            
            String ipAddress = request.getRemoteAddr();
            return (ipAddress != null && !ipAddress.isEmpty()) ? ipAddress : "unknown";
            
        } catch (Exception e) {
            logger.debug("Error getting client IP", e);
            return "unknown";
        }
    }
    
    private boolean isValidIpAddress(String ipAddress) {
        return ipAddress != null && 
               !ipAddress.isEmpty() && 
               !ipAddress.equalsIgnoreCase("unknown") &&
               !ipAddress.equalsIgnoreCase("null") &&
               ipAddress.length() > 0 &&
               ipAddress.length() <= 45;
    }
    
    private void validateInputSecurity(String input, String clientIp) {
        if (input == null) return;
        
        if (containsSqlInjectionPatterns(input)) {
            securityLogger.error("SQL_INJECTION_ATTEMPT - IP: {}, Input: {}", clientIp, sanitizeForLog(input));
            logService.createLog(
                    AppConstants.LOG_ACTION_SECURITY,
                    "SQL injection attempt detected: " + sanitizeForLog(input),
                    clientIp,
                    AppConstants.LOG_TYPE_SECURITY,
                    getCurrentUserIdSafely());
            throw new SecurityException("Invalid input detected");
        }
        
        if (containsXssPatterns(input)) {
            securityLogger.error("XSS_ATTEMPT - IP: {}, Input: {}", clientIp, sanitizeForLog(input));
            logService.createLog(
                    AppConstants.LOG_ACTION_SECURITY,
                    "XSS attempt detected: " + sanitizeForLog(input),
                    clientIp,
                    AppConstants.LOG_TYPE_SECURITY,
                    getCurrentUserIdSafely());
            throw new SecurityException("Invalid input detected");
        }
        
        if (containsPathTraversalPatterns(input)) {
            securityLogger.error("PATH_TRAVERSAL_ATTEMPT - IP: {}, Input: {}", clientIp, sanitizeForLog(input));
            logService.createLog(
                    AppConstants.LOG_ACTION_SECURITY,
                    "Path traversal attempt detected: " + sanitizeForLog(input),
                    clientIp,
                    AppConstants.LOG_TYPE_SECURITY,
                    getCurrentUserIdSafely());
            throw new SecurityException("Invalid input detected");
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
    
    private String sanitizeForLog(String input) {
        if (input == null) return "null";
        return input.replaceAll("[\\r\\n\\t]", " ")
                   .replaceAll("\\s+", " ")
                   .trim()
                   .substring(0, Math.min(input.length(), 100));
    }
}