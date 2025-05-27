package com.secureops.service;

import java.nio.file.Path;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {
    String storeFile(MultipartFile file);
    Resource loadFileAsResource(String fileName);
    void deleteFile(String fileName);
    Path getStorageDirectory();
}