package com.secureops;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

import com.secureops.config.FileStorageConfig;

@SpringBootApplication
// @EnableJpaAuditing
@EnableConfigurationProperties({
    FileStorageConfig.class
})
public class SecureOpsApplication {

    public static void main(String[] args) {
        SpringApplication.run(SecureOpsApplication.class, args);
    }
}