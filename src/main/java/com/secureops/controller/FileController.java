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
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !isValidFilename(originalFilename)) {
            return ResponseEntity.badRequest().build();
        }

        // file deepcode ignore PT: <already fixed>
        String fileName = fileStorageService.storeFile(file);
        System.out.println("Stored file name: " + fileName);

        String fileDownloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/files/download/")
                .path(fileName)
                .toUriString();
        System.out.println("Generated fileDownloadUri: " + fileDownloadUri);

        Long currentUserId = userService.getCurrentUser().getId();
        logService.createLog(
                AppConstants.LOG_ACTION_CREATE,
                "File uploaded: " + originalFilename,
                getClientIpSafely(null),
                AppConstants.LOG_TYPE_FILE,
                currentUserId);

        FileUploadResponse response = new FileUploadResponse(
                originalFilename,
                fileDownloadUri,
                file.getContentType(),
                file.getSize());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/download/{fileName:.+}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String fileName, HttpServletRequest request) {
        if (!isValidFilename(fileName)) {
            return ResponseEntity.badRequest().build();
        }

        Resource resource;
        try {
            resource = fileStorageService.loadFileAsResource(fileName);
            if (!isResourceInAllowedDirectory(resource)) {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }

        

        String contentType = null;
        try {
            contentType = request.getServletContext().getMimeType(resource.getFile().getAbsolutePath());
        } catch (IOException ex) {
            System.err.println("Could not determine file type: " + ex.getMessage());
        }

        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() &&
                    !authentication.getPrincipal().toString().equals("anonymousUser")) {
                Long currentUserId = userService.getCurrentUser().getId();
                logService.createLog(
                        AppConstants.LOG_ACTION_READ,
                        "File downloaded: " + fileName,
                        getClientIpSafely(request),
                        AppConstants.LOG_TYPE_FILE,
                        currentUserId);
            } else {
                logService.createLog(
                        AppConstants.LOG_ACTION_READ,
                        "File downloaded by anonymous user: " + fileName,
                        getClientIpSafely(request),
                        AppConstants.LOG_TYPE_FILE,
                        null);
            }
        } catch (Exception e) {
            System.err.println("Could not log file download: " + e.getMessage());
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    @DeleteMapping("/{fileName:.+}")
    public ResponseEntity<Void> deleteFile(@PathVariable String fileName) {
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
                    currentUserId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
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

    private String getClientIpSafely(HttpServletRequest request) {
        if (request == null) {
            request = ((org.springframework.web.context.request.ServletRequestAttributes) org.springframework.web.context.request.RequestContextHolder
                    .currentRequestAttributes()).getRequest();
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
        return ipAddress;
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