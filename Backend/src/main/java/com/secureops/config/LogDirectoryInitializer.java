package com.secureops.config;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;
import java.io.File;

@Component
public class LogDirectoryInitializer {
    
    @PostConstruct
    public void init() {
        // Create main logs directory
        File logDir = new File("logs");
        if (!logDir.exists()) {
            logDir.mkdirs();
        }
        
        // Create archive directory for rotated logs
        File archiveDir = new File("logs/archived");
        if (!archiveDir.exists()) {
            archiveDir.mkdirs();
        }
    }
}