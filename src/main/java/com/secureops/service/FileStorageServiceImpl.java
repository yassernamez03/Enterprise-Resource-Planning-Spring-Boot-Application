package com.secureops.service;

import com.secureops.config.FileStorageConfig;
import com.secureops.exception.FileStorageException;
import com.secureops.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageServiceImpl implements FileStorageService {

    private static final Logger logger = LoggerFactory.getLogger(FileStorageServiceImpl.class);

    private final Path fileStorageLocation;

    public FileStorageServiceImpl(FileStorageConfig fileStorageConfig) {
        this.fileStorageLocation = fileStorageConfig.getFileStorageLocation();
        
        logger.info("Initializing FileStorageService with storage location: {}", fileStorageLocation);
        
        try {
            Files.createDirectories(this.fileStorageLocation);
            logger.debug("Storage directory created or already exists: {}", fileStorageLocation);
        } catch (Exception ex) {
            logger.error("Failed to create storage directory: {}", fileStorageLocation, ex);
            throw new FileStorageException("Could not create the directory where the uploaded files will be stored.", ex);
        }
    }

    @Override
    public String storeFile(MultipartFile file) {
        // Normalize file name
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
        logger.debug("Attempting to store file: {}", originalFileName);
        
        // Check if the file's name contains invalid characters
        if (originalFileName.contains("..")) {
            logger.warn("Invalid file name detected: {}", originalFileName);
            throw new FileStorageException("Filename contains invalid path sequence " + originalFileName);
        }
        
        // Generate unique filename to prevent overwriting existing files
        String fileExtension = "";
        if (originalFileName.contains(".")) {
            fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
        }
        String fileName = UUID.randomUUID().toString() + fileExtension;
        logger.debug("Generated unique filename: {} for original file: {}", fileName, originalFileName);
        
        try {
            // Copy file to the target location
            Path targetLocation = this.fileStorageLocation.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            
            logger.info("File stored successfully: {} at location: {}", fileName, targetLocation);
            return fileName;
        } catch (IOException ex) {
            logger.error("Failed to store file: {} at location: {}", fileName, fileStorageLocation, ex);
            throw new FileStorageException("Could not store file " + fileName + ". Please try again!", ex);
        }
    }

    @Override
    public Resource loadFileAsResource(String fileName) {
        logger.debug("Attempting to load file as resource: {}", fileName);
        
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            
            if (resource.exists()) {
                logger.info("File resource loaded successfully: {}", fileName);
                return resource;
            } else {
                logger.warn("File not found: {} at path: {}", fileName, filePath);
                throw new ResourceNotFoundException("File", "fileName", fileName);
            }
        } catch (MalformedURLException ex) {
            logger.error("Invalid file path for file: {}", fileName, ex);
            throw new ResourceNotFoundException("File", "fileName", fileName);
        }
    }

    @Override
    public void deleteFile(String fileName) {
        logger.debug("Attempting to delete file: {}", fileName);
        
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            if (Files.deleteIfExists(filePath)) {
                logger.info("File deleted successfully: {}", fileName);
            } else {
                logger.warn("File not found for deletion: {} at path: {}", fileName, filePath);
            }
        } catch (IOException ex) {
            logger.error("Failed to delete file: {}", fileName, ex);
            throw new FileStorageException("Could not delete file " + fileName, ex);
        }
    }
    
    @Override
    public Path getStorageDirectory() {
        logger.debug("Retrieving storage directory: {}", fileStorageLocation);
        return this.fileStorageLocation;
    }
}