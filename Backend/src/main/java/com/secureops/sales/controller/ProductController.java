package com.secureops.sales.controller;

import com.secureops.sales.dto.request.ProductRequest;
import com.secureops.sales.dto.response.ProductResponse;
import com.secureops.sales.service.ProductService;
import com.secureops.service.LogService;
import com.secureops.service.UserService;
import com.secureops.util.AppConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
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

@RestController
@RequestMapping("/api/sales/products")
public class ProductController {

    private static final Logger logger = LoggerFactory.getLogger(ProductController.class);
    private static final Logger securityLogger = LoggerFactory.getLogger("com.secureops.security");

    private final ProductService productService;
    private final LogService logService;
    private final UserService userService;

    @Autowired
    public ProductController(ProductService productService, LogService logService, UserService userService) {
        this.productService = productService;
        this.logService = logService;
        this.userService = userService;
        logger.info("ProductController initialized");
    }    @GetMapping
    public ResponseEntity<Page<ProductResponse>> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("All products retrieval request - userId: {}, username: {}, page: {}, size: {}, ip: {}", 
                currentUserId, currentUsername, page, size, clientIp);
        
        securityLogger.info("SALES_PRODUCTS_LIST_ACCESS - User: {} (ID: {}), IP: {}, Action: VIEW_ALL_PRODUCTS", 
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
                        "Invalid pagination parameters for products list - page: " + page + ", size: " + size,
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            Page<ProductResponse> products = productService.getAllProducts(page, size);
            
            logger.info("All products retrieved successfully - count: {}, userId: {}, ip: {}", 
                    products.getTotalElements(), currentUserId, clientIp);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Retrieved products list - page: " + page + ", size: " + size + ", total: " + products.getTotalElements(),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(products);
            
        } catch (Exception e) {
            logger.error("Error retrieving products - userId: {}, username: {}, ip: {}", 
                    currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_PRODUCTS_LIST_ERROR - User: {} (ID: {}), IP: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve products list: " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }
    }
    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable Long id) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Product by ID retrieval request - productId: {}, userId: {}, username: {}, ip: {}", 
                id, currentUserId, currentUsername, clientIp);
        
        securityLogger.info("SALES_PRODUCT_DETAIL_ACCESS - User: {} (ID: {}), IP: {}, ProductId: {}, Action: VIEW_PRODUCT", 
                currentUsername, currentUserId, clientIp, id);
        
        try {
            // Validate product ID
            if (id == null || id <= 0) {
                logger.warn("Invalid product ID parameter: {} - userId: {}, ip: {}", 
                        id, currentUserId, clientIp);
                securityLogger.warn("INVALID_PRODUCT_ID_PARAMETER - User: {} (ID: {}), IP: {}, InvalidProductId: {}", 
                        currentUsername, currentUserId, clientIp, id);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_READ,
                        "Invalid product ID parameter: " + id,
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            // Validate path parameter for security
            validateInputSecurity(String.valueOf(id), clientIp);
            
            ProductResponse product = productService.getProductById(id);
            
            logger.info("Product retrieved successfully - productId: {}, productName: {}, userId: {}, ip: {}", 
                    id, product.getName(), currentUserId, clientIp);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Retrieved product details - ID: " + id + ", Name: " + product.getName(),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(product);
            
        } catch (Exception e) {
            logger.error("Error retrieving product {} - userId: {}, username: {}, ip: {}", 
                    id, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_PRODUCT_DETAIL_ERROR - User: {} (ID: {}), IP: {}, ProductId: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, id, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve product " + id + ": " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/create")
    public ResponseEntity<ProductResponse> createProduct(@Valid @RequestBody ProductRequest request, BindingResult bindingResult) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Product creation request - userId: {}, username: {}, ip: {}", 
                currentUserId, currentUsername, clientIp);
        
        securityLogger.info("SALES_PRODUCT_CREATE_REQUEST - User: {} (ID: {}), IP: {}, Action: CREATE_PRODUCT", 
                currentUsername, currentUserId, clientIp);
        
        try {
            // Validate binding results
            if (bindingResult.hasErrors()) {
                logger.warn("Validation errors in product creation - userId: {}, ip: {}, errors: {}", 
                        currentUserId, clientIp, bindingResult.getAllErrors());
                securityLogger.warn("PRODUCT_VALIDATION_ERRORS - User: {} (ID: {}), IP: {}, Errors: {}", 
                        currentUsername, currentUserId, clientIp, bindingResult.getAllErrors());
                
                logService.createLog(
                        AppConstants.LOG_ACTION_CREATE,
                        "Product creation validation errors: " + bindingResult.getAllErrors(),
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
              // Validate input security
            if (request.getName() != null) {
                validateInputSecurity(request.getName(), clientIp);
            }
            if (request.getDescription() != null) {
                validateInputSecurity(request.getDescription(), clientIp);
            }
            
            ProductResponse createdProduct = productService.createProduct(request);
            
            logger.info("Product created successfully - productId: {}, productName: {}, userId: {}, ip: {}", 
                    createdProduct.getId(), createdProduct.getName(), currentUserId, clientIp);
            
            securityLogger.info("SALES_PRODUCT_CREATED - User: {} (ID: {}), IP: {}, ProductId: {}, ProductName: {}", 
                    currentUsername, currentUserId, clientIp, createdProduct.getId(), createdProduct.getName());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "Created new product - ID: " + createdProduct.getId() + ", Name: " + createdProduct.getName(),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return new ResponseEntity<>(createdProduct, HttpStatus.CREATED);
            
        } catch (Exception e) {
            logger.error("Error creating product - userId: {}, username: {}, ip: {}", 
                    currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_PRODUCT_CREATE_ERROR - User: {} (ID: {}), IP: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "Failed to create product: " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }
    }    @PutMapping("/update/{id}")
    public ResponseEntity<ProductResponse> updateProduct(@PathVariable Long id, @Valid @RequestBody ProductRequest request, BindingResult bindingResult) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Product update request - productId: {}, userId: {}, username: {}, ip: {}", 
                id, currentUserId, currentUsername, clientIp);
        
        securityLogger.info("SALES_PRODUCT_UPDATE_REQUEST - User: {} (ID: {}), IP: {}, ProductId: {}, Action: UPDATE_PRODUCT", 
                currentUsername, currentUserId, clientIp, id);
        
        try {
            // Validate product ID
            if (id == null || id <= 0) {
                logger.warn("Invalid product ID parameter: {} - userId: {}, ip: {}", 
                        id, currentUserId, clientIp);
                securityLogger.warn("INVALID_PRODUCT_ID_PARAMETER - User: {} (ID: {}), IP: {}, InvalidProductId: {}", 
                        currentUsername, currentUserId, clientIp, id);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_UPDATE,
                        "Invalid product ID parameter: " + id,
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            // Validate binding results
            if (bindingResult.hasErrors()) {
                logger.warn("Validation errors in product update - productId: {}, userId: {}, ip: {}, errors: {}", 
                        id, currentUserId, clientIp, bindingResult.getAllErrors());
                securityLogger.warn("PRODUCT_UPDATE_VALIDATION_ERRORS - User: {} (ID: {}), IP: {}, ProductId: {}, Errors: {}", 
                        currentUsername, currentUserId, clientIp, id, bindingResult.getAllErrors());
                
                logService.createLog(
                        AppConstants.LOG_ACTION_UPDATE,
                        "Product update validation errors for ID " + id + ": " + bindingResult.getAllErrors(),
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            // Validate input security
            validateInputSecurity(String.valueOf(id), clientIp);            if (request.getName() != null) {
                validateInputSecurity(request.getName(), clientIp);
            }
            if (request.getDescription() != null) {
                validateInputSecurity(request.getDescription(), clientIp);
            }
            
            ProductResponse updatedProduct = productService.updateProduct(id, request);
            
            logger.info("Product updated successfully - productId: {}, productName: {}, userId: {}, ip: {}", 
                    id, updatedProduct.getName(), currentUserId, clientIp);
            
            securityLogger.info("SALES_PRODUCT_UPDATED - User: {} (ID: {}), IP: {}, ProductId: {}, ProductName: {}", 
                    currentUsername, currentUserId, clientIp, id, updatedProduct.getName());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_UPDATE,
                    "Updated product - ID: " + id + ", Name: " + updatedProduct.getName(),
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(updatedProduct);
            
        } catch (Exception e) {
            logger.error("Error updating product {} - userId: {}, username: {}, ip: {}", 
                    id, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_PRODUCT_UPDATE_ERROR - User: {} (ID: {}), IP: {}, ProductId: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, id, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_UPDATE,
                    "Failed to update product " + id + ": " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Product deletion request - productId: {}, userId: {}, username: {}, ip: {}", 
                id, currentUserId, currentUsername, clientIp);
        
        securityLogger.info("SALES_PRODUCT_DELETE_REQUEST - User: {} (ID: {}), IP: {}, ProductId: {}, Action: DELETE_PRODUCT", 
                currentUsername, currentUserId, clientIp, id);
        
        try {
            // Validate product ID
            if (id == null || id <= 0) {
                logger.warn("Invalid product ID parameter: {} - userId: {}, ip: {}", 
                        id, currentUserId, clientIp);
                securityLogger.warn("INVALID_PRODUCT_ID_PARAMETER - User: {} (ID: {}), IP: {}, InvalidProductId: {}", 
                        currentUsername, currentUserId, clientIp, id);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_DELETE,
                        "Invalid product ID parameter: " + id,
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                        
                return ResponseEntity.badRequest().build();
            }
            
            // Validate path parameter for security
            validateInputSecurity(String.valueOf(id), clientIp);
            
            productService.deleteProduct(id);
            
            logger.info("Product deleted successfully - productId: {}, userId: {}, ip: {}", 
                    id, currentUserId, clientIp);
            
            securityLogger.info("SALES_PRODUCT_DELETED - User: {} (ID: {}), IP: {}, ProductId: {}", 
                    currentUsername, currentUserId, clientIp, id);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_DELETE,
                    "Deleted product - ID: " + id,
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.noContent().build();
            
        } catch (Exception e) {
            logger.error("Error deleting product {} - userId: {}, username: {}, ip: {}", 
                    id, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("SALES_PRODUCT_DELETE_ERROR - User: {} (ID: {}), IP: {}, ProductId: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, id, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_DELETE,
                    "Failed to delete product " + id + ": " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<ProductResponse>> searchProducts(@RequestParam String query) {
        return ResponseEntity.ok(productService.searchProducts(query));
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<ProductResponse>> getProductsByCategory(@PathVariable String category) {
        return ResponseEntity.ok(productService.getProductsByCategory(category));
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
                    // Get first IP in case of comma-separated list
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
               ipAddress.length() <= 45; // IPv6 max length
    }
    
    private void validateInputSecurity(String input, String clientIp) {
        if (input == null) return;
        
        // Check for SQL injection patterns
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
        
        // Check for XSS patterns
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
        
        // Check for path traversal patterns
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