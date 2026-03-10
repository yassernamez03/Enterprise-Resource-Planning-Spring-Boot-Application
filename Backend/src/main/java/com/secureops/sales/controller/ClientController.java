package com.secureops.sales.controller;

import com.secureops.sales.dto.request.ClientRequest;
import com.secureops.sales.dto.response.ClientResponse;
import com.secureops.sales.service.ClientService;
import com.secureops.service.LogService;
import com.secureops.service.UserService;
import com.secureops.util.AppConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
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
import java.util.List;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/sales/clients")
public class ClientController {

    private static final Logger logger = LoggerFactory.getLogger(ClientController.class);
    private static final Logger securityLogger = LoggerFactory.getLogger("com.secureops.security");

    private final ClientService clientService;
    private final LogService logService;
    private final UserService userService;

    @Autowired
    public ClientController(ClientService clientService, LogService logService, UserService userService) {
        this.clientService = clientService;
        this.logService = logService;
        this.userService = userService;
        logger.info("ClientController initialized");
    }    @GetMapping
    public ResponseEntity<Page<ClientResponse>> getAllClients(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("All clients retrieval request - userId: {}, username: {}, page: {}, size: {}, ip: {}", 
                currentUserId, currentUsername, page, size, clientIp);
        
        securityLogger.info("SALES_CLIENTS_LIST_ACCESS - User: {} (ID: {}), IP: {}, Action: VIEW_ALL_CLIENTS", 
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
                        "Invalid pagination parameters for clients list - page: " + page + ", size: " + size,
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            Page<ClientResponse> clients = clientService.getAllClients(page, size);
            
            logger.info("All clients retrieved successfully - count: {}, userId: {}, ip: {}", 
                    clients.getTotalElements(), currentUserId, clientIp);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Retrieved clients list - page: " + page + ", size: " + size + ", total: " + clients.getTotalElements(),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(clients);
            
        } catch (Exception e) {
            logger.error("Error retrieving clients - userId: {}, username: {}, ip: {}", 
                    currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_CLIENTS_LIST_ERROR - User: {} (ID: {}), IP: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve clients list: " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }
    }    @GetMapping("/{id}")
    public ResponseEntity<ClientResponse> getClientById(@PathVariable Long id) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Client by ID retrieval request - clientId: {}, userId: {}, username: {}, ip: {}", 
                id, currentUserId, currentUsername, clientIp);
        
        securityLogger.info("SALES_CLIENT_DETAIL_ACCESS - User: {} (ID: {}), IP: {}, ClientId: {}, Action: VIEW_CLIENT", 
                currentUsername, currentUserId, clientIp, id);
        
        try {
            // Validate client ID
            if (id == null || id <= 0) {
                logger.warn("Invalid client ID parameter: {} - userId: {}, ip: {}", 
                        id, currentUserId, clientIp);
                securityLogger.warn("INVALID_CLIENT_ID_PARAMETER - User: {} (ID: {}), IP: {}, InvalidClientId: {}", 
                        currentUsername, currentUserId, clientIp, id);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_READ,
                        "Invalid client ID parameter: " + id,
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            // Validate path parameter for security
            validateInputSecurity(String.valueOf(id), clientIp);
            
            ClientResponse client = clientService.getClientById(id);
            
            logger.info("Client retrieved successfully - clientId: {}, clientName: {}, userId: {}, ip: {}", 
                    id, client.getName(), currentUserId, clientIp);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Retrieved client details - ID: " + id + ", Name: " + client.getName(),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(client);
            
        } catch (Exception e) {
            logger.error("Error retrieving client {} - userId: {}, username: {}, ip: {}", 
                    id, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_CLIENT_DETAIL_ERROR - User: {} (ID: {}), IP: {}, ClientId: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, id, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve client " + id + ": " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }
    }    @PostMapping("/create")
    public ResponseEntity<ClientResponse> createClient(@Valid @RequestBody ClientRequest request, BindingResult bindingResult) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Client creation request - userId: {}, username: {}, ip: {}", 
                currentUserId, currentUsername, clientIp);
        
        securityLogger.info("SALES_CLIENT_CREATE_REQUEST - User: {} (ID: {}), IP: {}, Action: CREATE_CLIENT", 
                currentUsername, currentUserId, clientIp);
        
        try {
            // Validate binding results
            if (bindingResult.hasErrors()) {
                logger.warn("Validation errors in client creation - userId: {}, ip: {}, errors: {}", 
                        currentUserId, clientIp, bindingResult.getAllErrors());
                securityLogger.warn("CLIENT_VALIDATION_ERRORS - User: {} (ID: {}), IP: {}, Errors: {}", 
                        currentUsername, currentUserId, clientIp, bindingResult.getAllErrors());
                
                logService.createLog(
                        AppConstants.LOG_ACTION_CREATE,
                        "Client creation validation errors: " + bindingResult.getAllErrors(),
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            // Validate input security
            if (request.getName() != null) {
                validateInputSecurity(request.getName(), clientIp);
            }
            if (request.getEmail() != null) {
                validateInputSecurity(request.getEmail(), clientIp);
            }            if (request.getPhone() != null) {
                validateInputSecurity(request.getPhone(), clientIp);
            }
            if (request.getAddress() != null) {
                validateInputSecurity(request.getAddress(), clientIp);
            }
            if (request.getName() != null) {
                validateInputSecurity(request.getName(), clientIp);
            }
            
            ClientResponse createdClient = clientService.createClient(request);
            
            logger.info("Client created successfully - clientId: {}, clientName: {}, userId: {}, ip: {}", 
                    createdClient.getId(), createdClient.getName(), currentUserId, clientIp);
            
            securityLogger.info("SALES_CLIENT_CREATED - User: {} (ID: {}), IP: {}, ClientId: {}, ClientName: {}", 
                    currentUsername, currentUserId, clientIp, createdClient.getId(), createdClient.getName());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "Created new client - ID: " + createdClient.getId() + ", Name: " + createdClient.getName(),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return new ResponseEntity<>(createdClient, HttpStatus.CREATED);
            
        } catch (Exception e) {
            logger.error("Error creating client - userId: {}, username: {}, ip: {}", 
                    currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_CLIENT_CREATE_ERROR - User: {} (ID: {}), IP: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "Failed to create client: " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }
    }    @PutMapping("/update/{id}")
    public ResponseEntity<ClientResponse> updateClient(@PathVariable Long id, @Valid @RequestBody ClientRequest request, BindingResult bindingResult) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Client update request - clientId: {}, userId: {}, username: {}, ip: {}", 
                id, currentUserId, currentUsername, clientIp);
        
        securityLogger.info("SALES_CLIENT_UPDATE_REQUEST - User: {} (ID: {}), IP: {}, ClientId: {}, Action: UPDATE_CLIENT", 
                currentUsername, currentUserId, clientIp, id);
        
        try {
            // Validate client ID
            if (id == null || id <= 0) {
                logger.warn("Invalid client ID parameter for update: {} - userId: {}, ip: {}", 
                        id, currentUserId, clientIp);
                securityLogger.warn("INVALID_CLIENT_ID_UPDATE - User: {} (ID: {}), IP: {}, InvalidClientId: {}", 
                        currentUsername, currentUserId, clientIp, id);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_UPDATE,
                        "Invalid client ID parameter for update: " + id,
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            // Validate binding results
            if (bindingResult.hasErrors()) {
                logger.warn("Validation errors in client update - clientId: {}, userId: {}, ip: {}, errors: {}", 
                        id, currentUserId, clientIp, bindingResult.getAllErrors());
                securityLogger.warn("CLIENT_UPDATE_VALIDATION_ERRORS - User: {} (ID: {}), IP: {}, ClientId: {}, Errors: {}", 
                        currentUsername, currentUserId, clientIp, id, bindingResult.getAllErrors());
                
                logService.createLog(
                        AppConstants.LOG_ACTION_UPDATE,
                        "Client update validation errors for ID " + id + ": " + bindingResult.getAllErrors(),
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            // Validate path parameter and input security
            validateInputSecurity(String.valueOf(id), clientIp);
            if (request.getName() != null) {
                validateInputSecurity(request.getName(), clientIp);
            }
            if (request.getEmail() != null) {
                validateInputSecurity(request.getEmail(), clientIp);
            }            if (request.getPhone() != null) {
                validateInputSecurity(request.getPhone(), clientIp);
            }
            if (request.getAddress() != null) {
                validateInputSecurity(request.getAddress(), clientIp);
            }
            if (request.getName() != null) {
                validateInputSecurity(request.getName(), clientIp);
            }
            
            ClientResponse updatedClient = clientService.updateClient(id, request);
            
            logger.info("Client updated successfully - clientId: {}, clientName: {}, userId: {}, ip: {}", 
                    id, updatedClient.getName(), currentUserId, clientIp);
            
            securityLogger.info("SALES_CLIENT_UPDATED - User: {} (ID: {}), IP: {}, ClientId: {}, ClientName: {}", 
                    currentUsername, currentUserId, clientIp, id, updatedClient.getName());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_UPDATE,
                    "Updated client - ID: " + id + ", Name: " + updatedClient.getName(),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(updatedClient);
            
        } catch (Exception e) {
            logger.error("Error updating client {} - userId: {}, username: {}, ip: {}", 
                    id, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_CLIENT_UPDATE_ERROR - User: {} (ID: {}), IP: {}, ClientId: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, id, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_UPDATE,
                    "Failed to update client " + id + ": " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }
    }    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteClient(@PathVariable Long id) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Client deletion request - clientId: {}, userId: {}, username: {}, ip: {}", 
                id, currentUserId, currentUsername, clientIp);
        
        securityLogger.info("SALES_CLIENT_DELETE_REQUEST - User: {} (ID: {}), IP: {}, ClientId: {}, Action: DELETE_CLIENT", 
                currentUsername, currentUserId, clientIp, id);
        
        try {
            // Validate client ID
            if (id == null || id <= 0) {
                logger.warn("Invalid client ID parameter for deletion: {} - userId: {}, ip: {}", 
                        id, currentUserId, clientIp);
                securityLogger.warn("INVALID_CLIENT_ID_DELETE - User: {} (ID: {}), IP: {}, InvalidClientId: {}", 
                        currentUsername, currentUserId, clientIp, id);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_DELETE,
                        "Invalid client ID parameter for deletion: " + id,
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            // Validate path parameter for security
            validateInputSecurity(String.valueOf(id), clientIp);
            
            // Get client info before deletion for logging
            ClientResponse clientToDelete = clientService.getClientById(id);
            
            clientService.deleteClient(id);
            
            logger.info("Client deleted successfully - clientId: {}, clientName: {}, userId: {}, ip: {}", 
                    id, clientToDelete.getName(), currentUserId, clientIp);
            
            securityLogger.info("SALES_CLIENT_DELETED - User: {} (ID: {}), IP: {}, ClientId: {}, ClientName: {}", 
                    currentUsername, currentUserId, clientIp, id, clientToDelete.getName());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_DELETE,
                    "Deleted client - ID: " + id + ", Name: " + clientToDelete.getName(),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.noContent().build();
            
        } catch (Exception e) {
            logger.error("Error deleting client {} - userId: {}, username: {}, ip: {}", 
                    id, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_CLIENT_DELETE_ERROR - User: {} (ID: {}), IP: {}, ClientId: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, id, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_DELETE,
                    "Failed to delete client " + id + ": " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<ClientResponse>> searchClients(@RequestParam String query) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Client search request - query: {}, userId: {}, username: {}, ip: {}", 
                query, currentUserId, currentUsername, clientIp);
        
        securityLogger.info("SALES_CLIENT_SEARCH_REQUEST - User: {} (ID: {}), IP: {}, Query: {}, Action: SEARCH_CLIENTS", 
                currentUsername, currentUserId, clientIp, query);
        
        try {
            // Validate search query
            if (query == null || query.trim().isEmpty()) {
                logger.warn("Empty search query - userId: {}, ip: {}", currentUserId, clientIp);
                securityLogger.warn("EMPTY_CLIENT_SEARCH_QUERY - User: {} (ID: {}), IP: {}", 
                        currentUsername, currentUserId, clientIp);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_READ,
                        "Empty client search query",
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            // Validate input security
            validateInputSecurity(query, clientIp);
            
            // Sanitize search query
            String sanitizedQuery = sanitizeInput(query);
            
            List<ClientResponse> searchResults = clientService.searchClients(sanitizedQuery);
            
            logger.info("Client search completed - query: {}, results: {}, userId: {}, ip: {}", 
                    sanitizedQuery, searchResults.size(), currentUserId, clientIp);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Client search - query: " + sanitizedQuery + ", results: " + searchResults.size(),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(searchResults);
            
        } catch (Exception e) {
            logger.error("Error searching clients - query: {}, userId: {}, username: {}, ip: {}", 
                    query, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_CLIENT_SEARCH_ERROR - User: {} (ID: {}), IP: {}, Query: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, query, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to search clients - query: " + query + ", error: " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }
    }
    
    // ============== SECURITY AND UTILITY METHODS ==============
      private Long getCurrentUserIdSafely() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() && 
                !authentication.getName().equals("anonymousUser")) {
                // Use getUserByEmail since we don't have getUserByUsername
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
                if (ipAddress != null && !ipAddress.isEmpty() && !"unknown".equalsIgnoreCase(ipAddress)) {
                    if (header.equals("X-Forwarded-For") && ipAddress.contains(",")) {
                        ipAddress = ipAddress.split(",")[0].trim();
                    }
                    return ipAddress;
                }
            }
            
            return request.getRemoteAddr();
            
        } catch (Exception e) {
            logger.debug("Error retrieving client IP", e);
            return "unknown";
        }
    }
    
    private boolean containsSqlInjectionPatterns(String input) {
        if (input == null) return false;
        String lowerInput = input.toLowerCase();
        String[] sqlPatterns = {"'", "\"", ";", "--", "/*", "*/", "union", "select", "insert", 
                               "update", "delete", "drop", "exec", "script", "xp_", "sp_"};

        for (String pattern : sqlPatterns) {
            if (lowerInput.contains(pattern)) {
                return true;
            }
        }
        return false;
    }

    private boolean containsXssPatterns(String input) {
        if (input == null) return false;
        String lowerInput = input.toLowerCase();
        String[] xssPatterns = {"<script", "</script>", "javascript:", "onload=", "onclick=", "onerror=",
                               "onmouseover=", "eval(", "alert(", "confirm(", "prompt(", "document.cookie"};

        for (String pattern : xssPatterns) {
            if (lowerInput.contains(pattern)) {
                return true;
            }
        }
        return false;
    }

    private boolean containsPathTraversalPatterns(String input) {
        if (input == null) return false;
        return input.contains("../") || input.contains("..\\") || input.contains("/etc/") 
               || input.contains("\\windows\\") || input.contains("%2e%2e");
    }

    private void validateInputSecurity(String input, String clientIp) {
        if (containsSqlInjectionPatterns(input)) {
            securityLogger.error("SQL injection attempt in client operation - Input: {}, IP: {}", input, clientIp);
            throw new RuntimeException("Invalid input detected");
        }

        if (containsXssPatterns(input)) {
            securityLogger.warn("XSS attempt detected in client operation - Input: {}, IP: {}", input, clientIp);
            throw new RuntimeException("Invalid input detected");
        }

        if (containsPathTraversalPatterns(input)) {
            securityLogger.warn("Path traversal attempt in client operation - Input: {}, IP: {}", input, clientIp);
            throw new RuntimeException("Invalid input detected");
        }
    }
    
    private String sanitizeInput(String input) {
        if (input == null) return null;
        return input.replaceAll("[<>\"'&]", "").trim();
    }
}