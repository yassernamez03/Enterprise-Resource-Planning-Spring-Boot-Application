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
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;

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
        String fileName = fileStorageService.storeFile(file);
        
        String fileDownloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/files/download/")
                .path(fileName)
                .toUriString();
        
        Long currentUserId = userService.getCurrentUser().getId();
        logService.createLog(
            AppConstants.LOG_ACTION_CREATE,
            "File uploaded: " + file.getOriginalFilename(),
            getClientIp(),
            AppConstants.LOG_TYPE_FILE,
            currentUserId
        );
        
        FileUploadResponse response = new FileUploadResponse(
                file.getOriginalFilename(),
                fileDownloadUri,
                file.getContentType(),
                file.getSize()
        );
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/download/{fileName:.+}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String fileName, HttpServletRequest request) {
        // Load file as Resource
        Resource resource = fileStorageService.loadFileAsResource(fileName);
        
        // Try to determine file's content type
        String contentType = null;
        try {
            contentType = request.getServletContext().getMimeType(resource.getFile().getAbsolutePath());
        } catch (IOException ex) {
            // Logger would be used here in production
        }
        
        // Fallback to the default content type if type could not be determined
        if(contentType == null) {
            contentType = "application/octet-stream";
        }
        
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
    
    @DeleteMapping("/{fileName:.+}")
    public ResponseEntity<Void> deleteFile(@PathVariable String fileName) {
        fileStorageService.deleteFile(fileName);
        
        Long currentUserId = userService.getCurrentUser().getId();
        logService.createLog(
            AppConstants.LOG_ACTION_DELETE,
            "File deleted: " + fileName,
            getClientIp(),
            AppConstants.LOG_TYPE_FILE,
            currentUserId
        );
        
        return ResponseEntity.noContent().build();
    }
    
    private String getClientIp() {
        HttpServletRequest request = ((org.springframework.web.context.request.ServletRequestAttributes) 
                org.springframework.web.context.request.RequestContextHolder
                .currentRequestAttributes()).getRequest();
                
        String ipAddress = request.getHeader("X-Forwarded-For");
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getHeader("Proxy-Client-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getRemoteAddr();
        }
        return ipAddress;
    }
}