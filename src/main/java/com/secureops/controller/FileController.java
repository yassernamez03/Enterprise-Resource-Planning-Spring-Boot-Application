package com.secureops.controller;

import com.secureops.dto.FileUploadResponse;
import com.secureops.service.FileStorageService;
import com.secureops.service.LogService;
import com.secureops.service.UserService;
import com.secureops.util.AppConstants;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger logger = LoggerFactory.getLogger(FileController.class);
    private static final Logger securityLogger = LoggerFactory.getLogger("com.secureops.security");

    private final FileStorageService fileStorageService;
    private final UserService userService;
    private final LogService logService;

    // File size limits (in bytes)
    private static final long MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    private static final long LARGE_FILE_THRESHOLD = 10 * 1024 * 1024; // 10MB

    public FileController(FileStorageService fileStorageService,
            UserService userService,
            LogService logService) {
        this.fileStorageService = fileStorageService;
        this.userService = userService;
        this.logService = logService;
        logger.info("FileController initialized with max file size: {}MB", MAX_FILE_SIZE / (1024 * 1024));
    }

    @PostMapping("/upload")
    public ResponseEntity<FileUploadResponse> uploadFile(@RequestParam("file") MultipartFile file) {
        String originalFilename = file.getOriginalFilename();
        String clientIp = getClientIpSafely(null);
        Long currentUserId = getCurrentUserIdSafely();
        System.out.println("file contents :" + file);
        logger.debug("File upload request received - filename: {}, size: {} bytes, contentType: {}, userId: {}, ip: {}", 
                originalFilename, file.getSize(), file.getContentType(), currentUserId, clientIp);

        // Validate filename
        if (originalFilename == null || !isValidFilename(originalFilename)) {
            logger.warn("Invalid filename upload attempt: {}", originalFilename);
            securityLogger.warn("INVALID_FILENAME_UPLOAD - User: {}, IP: {}, Filename: {}", 
                    currentUserId, clientIp, originalFilename);
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "Invalid file upload attempted: " + (originalFilename != null ? originalFilename : "null filename"),
                    clientIp,
                    AppConstants.LOG_TYPE_SECURITY,
                    currentUserId);
            return ResponseEntity.badRequest().build();
        }

        // Check file size
        if (file.getSize() > MAX_FILE_SIZE) {
            logger.warn("File size limit exceeded: {} bytes (limit: {} bytes) for file: {}", 
                    file.getSize(), MAX_FILE_SIZE, originalFilename);
            securityLogger.warn("FILE_SIZE_LIMIT_EXCEEDED - User: {}, IP: {}, Filename: {}, Size: {} bytes", 
                    currentUserId, clientIp, originalFilename, file.getSize());
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "File size limit exceeded: " + originalFilename + " (" + file.getSize() + " bytes)",
                    clientIp,
                    AppConstants.LOG_TYPE_SECURITY,
                    currentUserId);
            return ResponseEntity.badRequest().build();
        }

        // Check if file is empty
        if (file.isEmpty()) {
            logger.warn("Empty file upload attempt: {}", originalFilename);
            securityLogger.warn("EMPTY_FILE_UPLOAD - User: {}, IP: {}, Filename: {}", 
                    currentUserId, clientIp, originalFilename);
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "Empty file upload attempted: " + originalFilename,
                    clientIp,
                    AppConstants.LOG_TYPE_SECURITY,
                    currentUserId);
            return ResponseEntity.badRequest().build();
        }

        // Check file type
        String contentType = file.getContentType();
        if (contentType != null && isRestrictedFileType(contentType)) {
            logger.warn("Restricted file type upload attempt: {} with content type: {}", originalFilename, contentType);
            securityLogger.warn("RESTRICTED_FILE_TYPE_UPLOAD - User: {}, IP: {}, Filename: {}, ContentType: {}", 
                    currentUserId, clientIp, originalFilename, contentType);
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "Restricted file type upload attempted: " + originalFilename + " (" + contentType + ")",
                    clientIp,
                    AppConstants.LOG_TYPE_SECURITY,
                    currentUserId);
            return ResponseEntity.badRequest().build();
        }

        // Log large file uploads
        if (file.getSize() > LARGE_FILE_THRESHOLD) {
            logger.info("Large file upload detected: {} ({} bytes)", originalFilename, file.getSize());
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "Large file upload: " + originalFilename + " (" + file.getSize() + " bytes)",
                    clientIp,
                    AppConstants.LOG_TYPE_FILE,
                    currentUserId);
        }

        try {
            // file deepcode ignore PT: <already fixed>
            String fileName = fileStorageService.storeFile(file);
            logger.info("File stored successfully: {} -> {}", originalFilename, fileName);

            String fileDownloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/api/files/download/")
                    .path(fileName)
                    .toUriString();
            logger.debug("Generated fileDownloadUri: {}", fileDownloadUri);

            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "File uploaded: " + originalFilename,
                    clientIp,
                    AppConstants.LOG_TYPE_FILE,
                    currentUserId);

            FileUploadResponse response = new FileUploadResponse(
                    originalFilename,
                    fileDownloadUri,
                    file.getContentType(),
                    file.getSize());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("File upload failed for: {} - {}", originalFilename, e.getMessage(), e);
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "File upload failed: " + originalFilename,
                    clientIp,
                    AppConstants.LOG_TYPE_FILE,
                    currentUserId);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/download/{fileName:.+}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String fileName, HttpServletRequest request) {
        String clientIp = getClientIpSafely(request);
        Long currentUserId = getCurrentUserIdSafely();

        logger.debug("File download request - filename: {}, userId: {}, ip: {}", fileName, currentUserId, clientIp);

        if (!isValidFilename(fileName)) {
            logger.warn("Invalid filename download attempt: {}", fileName);
            securityLogger.warn("INVALID_FILENAME_DOWNLOAD - User: {}, IP: {}, Filename: {}", 
                    currentUserId, clientIp, fileName);
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Invalid filename download attempted: " + fileName,
                    clientIp,
                    AppConstants.LOG_TYPE_SECURITY,
                    currentUserId);
            return ResponseEntity.badRequest().build();
        }

        Resource resource;
        try {
            resource = fileStorageService.loadFileAsResource(fileName);
            System.out.println("resource :" + resource);
            if (!isResourceInAllowedDirectory(resource)) {
                logger.warn("Path traversal attempt detected for file: {}", fileName);
                securityLogger.warn("PATH_TRAVERSAL_ATTEMPT - User: {}, IP: {}, Filename: {}", 
                        currentUserId, clientIp, fileName);
                logService.createLog(
                        AppConstants.LOG_ACTION_READ,
                        "Path traversal attempt detected for file: " + fileName,
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            logger.debug("File not found or access error: {} - {}", fileName, e.getMessage());
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "File not found: " + fileName,
                    clientIp,
                    AppConstants.LOG_TYPE_FILE,
                    currentUserId);
            return ResponseEntity.notFound().build();
        }

        // Check file size for monitoring
        try {
            long fileSize = resource.contentLength();
            if (fileSize > LARGE_FILE_THRESHOLD) {
                logger.info("Large file download: {} ({} bytes)", fileName, fileSize);
                logService.createLog(
                        AppConstants.LOG_ACTION_READ,
                        "Large file download: " + fileName + " (" + fileSize + " bytes)",
                        clientIp,
                        AppConstants.LOG_TYPE_FILE,
                        currentUserId);
            }
        } catch (IOException e) {
            logger.debug("Could not determine file size for: {} - {}", fileName, e.getMessage());
        }

        String contentType = null;
        try {
            contentType = request.getServletContext().getMimeType(resource.getFile().getAbsolutePath());
            logger.debug("Determined content type: {} for file: {}", contentType, fileName);
        } catch (IOException ex) {
            logger.debug("Could not determine file type for: {} - {}", fileName, ex.getMessage());
        }

        if (contentType == null) {
            contentType = "application/octet-stream";
            logger.debug("Using default content type for file: {}", fileName);
        }

        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() &&
                    !authentication.getPrincipal().toString().equals("anonymousUser")) {
                logService.createLog(
                        AppConstants.LOG_ACTION_READ,
                        "File downloaded: " + fileName,
                        clientIp,
                        AppConstants.LOG_TYPE_FILE,
                        currentUserId);
            } else {
                logger.info("Anonymous user downloaded file: {}", fileName);
                logService.createLog(
                        AppConstants.LOG_ACTION_READ,
                        "File downloaded by anonymous user: " + fileName,
                        clientIp,
                        AppConstants.LOG_TYPE_FILE,
                        null);
            }
        } catch (Exception e) {
            logger.error("Could not log file download for: {} - {}", fileName, e.getMessage());
        }

        logger.info("File download successful: {}", fileName);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    @DeleteMapping("/{fileName:.+}")
    public ResponseEntity<Void> deleteFile(@PathVariable String fileName) {
        String clientIp = getClientIpSafely(null);
        Long currentUserId = getCurrentUserIdSafely();
        
        logger.debug("File deletion request - filename: {}, userId: {}, ip: {}", fileName, currentUserId, clientIp);

        if (!isValidFilename(fileName)) {
            logger.warn("Invalid filename deletion attempt: {}", fileName);
            securityLogger.warn("INVALID_FILENAME_DELETE - User: {}, IP: {}, Filename: {}", 
                    currentUserId, clientIp, fileName);
            logService.createLog(
                    AppConstants.LOG_ACTION_DELETE,
                    "Invalid filename deletion attempted: " + fileName,
                    clientIp,
                    AppConstants.LOG_TYPE_SECURITY,
                    currentUserId);
            return ResponseEntity.badRequest().build();
        }

        try {
            // Check if file exists and validate path before deletion
            Resource resource = fileStorageService.loadFileAsResource(fileName);
            if (!isResourceInAllowedDirectory(resource)) {
                logger.warn("Path traversal attempt in file deletion: {}", fileName);
                securityLogger.warn("PATH_TRAVERSAL_DELETE - User: {}, IP: {}, Filename: {}", 
                        currentUserId, clientIp, fileName);
                logService.createLog(
                        AppConstants.LOG_ACTION_DELETE,
                        "Path traversal attempt in file deletion: " + fileName,
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        currentUserId);
                return ResponseEntity.notFound().build();
            }

            fileStorageService.deleteFile(fileName);
            logger.info("File deleted successfully: {}", fileName);
            logService.createLog(
                    AppConstants.LOG_ACTION_DELETE,
                    "File deleted: " + fileName,
                    clientIp,
                    AppConstants.LOG_TYPE_FILE,
                    currentUserId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            logger.debug("File deletion failed: {} - {}", fileName, e.getMessage());
            logService.createLog(
                    AppConstants.LOG_ACTION_DELETE,
                    "File deletion failed: " + fileName,
                    clientIp,
                    AppConstants.LOG_TYPE_FILE,
                    currentUserId);
            return ResponseEntity.notFound().build();
        }
    }

    private boolean isValidFilename(String fileName) {
        if (fileName == null || fileName.isEmpty()) {
            return false;
        }
        if (fileName.contains("../") || fileName.contains("..\\") ||
                fileName.contains("/") || fileName.contains("\\") ||
                fileName.contains(":") || fileName.startsWith(".") ||
                fileName.contains("\0") || fileName.contains("%00")) {
            return false;
        }
        return fileName.matches("^[\\p{L}\\p{M}\\p{N}\\p{P}\\p{Zs}]{1,255}$") &&
                !fileName.matches(".*[<>\"|?*].*");
    }

    private boolean isResourceInAllowedDirectory(Resource resource) throws IOException {
        Path resourcePath = Paths.get(resource.getFile().getCanonicalPath()).normalize();
        Path storageDirectory = fileStorageService.getStorageDirectory().normalize();
        return resourcePath.startsWith(storageDirectory);
    }

    private boolean isRestrictedFileType(String contentType) {
        String[] restrictedTypes = {
            "application/x-executable",
            "application/x-msdownload", 
            "application/x-msdos-program",
            "application/x-sh",
            "text/x-shellscript",
            "application/x-bat",
            "application/x-com",
            "application/x-exe",
            "application/x-winexe"
        };
        
        String lowerContentType = contentType.toLowerCase();
        for (String restrictedType : restrictedTypes) {
            if (lowerContentType.contains(restrictedType)) {
                return true;
            }
        }
        return false;
    }

    private Long getCurrentUserIdSafely() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() &&
                    !authentication.getPrincipal().toString().equals("anonymousUser")) {
                return userService.getCurrentUser().getId();
            }
        } catch (Exception e) {
            logger.debug("Could not get current user ID: {}", e.getMessage());
        }
        return null;
    }

    private String getClientIpSafely(HttpServletRequest request) {
        if (request == null) {
            try {
                request = ((org.springframework.web.context.request.ServletRequestAttributes) org.springframework.web.context.request.RequestContextHolder
                        .currentRequestAttributes()).getRequest();
            } catch (Exception e) {
                logger.debug("Could not get request from context: {}", e.getMessage());
                return "unknown";
            }
        }
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
        if (ipAddress != null && ipAddress.contains(",")) {
            ipAddress = ipAddress.split(",")[0].trim();
        }
        return ipAddress != null ? ipAddress : "unknown";
    }

    private String getHeaderValue(HttpServletRequest request, String headerName) {
        String value = request.getHeader(headerName);
        if (value == null || value.isEmpty() || "unknown".equalsIgnoreCase(value)) {
            return null;
        }
        if (value.length() > 100) {
            value = value.substring(0, 100);
        }
        return value;
    }
}