package com.secureops.controller;

import com.secureops.dto.FileUploadResponse;
import com.secureops.service.FileStorageService;
import com.secureops.service.LogService;
import com.secureops.service.UserService;
import com.secureops.util.AppConstants;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private final FileStorageService fileStorageService;
    private final UserService userService;
    private final LogService logService;

    public FileController(FileStorageService fileStorageService,
                         UserService userService,
                         LogService logService) {
        this.fileStorageService = fileStorageService;
        this.userService = userService;
        this.logService = logService;
    }

    @PostMapping("/upload")
    public ResponseEntity<FileUploadResponse> uploadFile(@RequestParam("file") MultipartFile file) {
        // Validate filename before storing
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !isValidFilename(originalFilename)) {
            return ResponseEntity.badRequest().build();
        }
        
        // file deepcode ignore PT: <i already fixed this>
        String fileName = fileStorageService.storeFile(file);
        
        String fileDownloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/files/download/")
                .path(fileName)
                .toUriString();
        
        Long currentUserId = userService.getCurrentUser().getId();
        logService.createLog(
            AppConstants.LOG_ACTION_CREATE,
            "File uploaded: " + originalFilename,
            getClientIpSafely(null),
            AppConstants.LOG_TYPE_FILE,
            currentUserId
        );
        
        FileUploadResponse response = new FileUploadResponse(
                originalFilename,
                fileDownloadUri,
                file.getContentType(),
                file.getSize()
        );
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/download/{fileName:.+}")
public ResponseEntity<Resource> downloadFile(@PathVariable String fileName, HttpServletRequest request) {
    // Validate the filename before processing
    if (!isValidFilename(fileName)) {
        return ResponseEntity.badRequest().build();
    }
    
    // Load file as Resource
    Resource resource;
    try {
        resource = fileStorageService.loadFileAsResource(fileName);
        // Verify the resource is within the expected directory
        if (!isResourceInAllowedDirectory(resource)) {
            return ResponseEntity.notFound().build();
        }
    } catch (Exception e) {
        return ResponseEntity.notFound().build();
    }
    
    // Try to determine file's content type
    String contentType = null;
    try {
        contentType = request.getServletContext().getMimeType(resource.getFile().getAbsolutePath());
    } catch (IOException ex) {
        // Log the error
        System.err.println("Could not determine file type: " + ex.getMessage());
    }
    
    // Fallback to the default content type if type could not be determined
    if(contentType == null) {
        contentType = "application/octet-stream";
    }
    
    // Log the download - but check authentication status first
    try {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        // Only try to log with user ID if we have a non-anonymous authenticated user
        if (authentication != null && authentication.isAuthenticated() && 
            !authentication.getPrincipal().toString().equals("anonymousUser")) {
            
            // User is authenticated, so we can safely get their ID
            Long currentUserId = userService.getCurrentUser().getId();
            logService.createLog(
                AppConstants.LOG_ACTION_READ,
                "File downloaded: " + fileName,
                getClientIpSafely(request),
                AppConstants.LOG_TYPE_FILE,
                currentUserId
            );
        } else {
            // For anonymous users, log without a user ID
            logService.createLog(
                AppConstants.LOG_ACTION_READ,
                "File downloaded by anonymous user: " + fileName,
                getClientIpSafely(request),
                AppConstants.LOG_TYPE_FILE,
                null  // No user ID for anonymous users
            );
        }
    } catch (Exception e) {
        // Just log the error but still return the file
        System.err.println("Could not log file download: " + e.getMessage());
    }
    
    return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(contentType))
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
            .body(resource);
}
    
    @DeleteMapping("/{fileName:.+}")
    public ResponseEntity<Void> deleteFile(@PathVariable String fileName) {
        // Validate the filename before processing
        if (!isValidFilename(fileName)) {
            return ResponseEntity.badRequest().build();
        }
        
        try {
            fileStorageService.deleteFile(fileName);
            
            Long currentUserId = userService.getCurrentUser().getId();
            logService.createLog(
                AppConstants.LOG_ACTION_DELETE,
                "File deleted: " + fileName,
                getClientIpSafely(null),
                AppConstants.LOG_TYPE_FILE,
                currentUserId
            );
            
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Validates that a filename does not contain directory traversal sequences or other dangerous characters
     */
    private boolean isValidFilename(String fileName) {
        // Reject null or empty filenames
        if (fileName == null || fileName.isEmpty()) {
            return false;
        }
        
        // Check for directory traversal patterns
        if (fileName.contains("../") || fileName.contains("..\\") || 
            fileName.contains("/") || fileName.contains("\\") ||
            fileName.contains(":") || fileName.startsWith(".")) {
            return false;
        }
        
        // Additional validation - allow only alphanumeric characters, dots, hyphens, and underscores
        return fileName.matches("^[a-zA-Z0-9._-]+$");
    }
    
    /**
     * Verifies that the resource is within the allowed storage directory
     */
    private boolean isResourceInAllowedDirectory(Resource resource) throws IOException {
        Path resourcePath = Paths.get(resource.getFile().getCanonicalPath()).normalize();
        // Get the storage directory from configuration (you'll need to implement this)
        Path storageDirectory = fileStorageService.getStorageDirectory().normalize();
        
        // Check if the resource is within the storage directory
        return resourcePath.startsWith(storageDirectory);
    }
    
    /**
     * Gets client IP safely by checking standard headers and fallbacks
     */
    private String getClientIpSafely(HttpServletRequest request) {
        if (request == null) {
            request = ((org.springframework.web.context.request.ServletRequestAttributes) 
                    org.springframework.web.context.request.RequestContextHolder
                    .currentRequestAttributes()).getRequest();
        }
        
        // Try to get IP from headers, but limit the length to prevent header injection
        String ipAddress = getHeaderValue(request, "X-Forwarded-For");
        if (ipAddress == null) {
            ipAddress = getHeaderValue(request, "Proxy-Client-IP");
        }
        if (ipAddress == null) {
            ipAddress = getHeaderValue(request, "WL-Proxy-Client-IP");
        }
        if (ipAddress == null) {
            ipAddress = request.getRemoteAddr();
        }
        
        // If X-Forwarded-For contains multiple IPs, take the first one (client IP)
        if (ipAddress != null && ipAddress.contains(",")) {
            ipAddress = ipAddress.split(",")[0].trim();
        }
        
        return ipAddress;
    }
    
    /**
     * Gets a header value safely with validation
     */
    private String getHeaderValue(HttpServletRequest request, String headerName) {
        String value = request.getHeader(headerName);
        if (value == null || value.isEmpty() || "unknown".equalsIgnoreCase(value)) {
            return null;
        }
        
        // Limit header length to prevent header injection
        if (value.length() > 100) {
            value = value.substring(0, 100);
        }
        
        return value;
    }
}