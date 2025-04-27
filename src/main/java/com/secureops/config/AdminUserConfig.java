package com.secureops.config;

import com.secureops.entity.User;
import com.secureops.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminUserConfig {

    @Value("${admin.email:admin@secureops.com}")
    private String adminEmail;

    @Value("${admin.fullName:System Administrator}")
    private String adminFullName;

    @Value("${admin.password:Admin@123}")
    private String adminPassword;

    @Bean
    public CommandLineRunner initAdminUser(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            // Check if admin user exists
            if (!userRepository.existsByEmail(adminEmail)) {
                // Create admin user
                User adminUser = new User();
                adminUser.setEmail(adminEmail);
                adminUser.setFullName(adminFullName);
                adminUser.setPassword(passwordEncoder.encode(adminPassword));
                adminUser.setRole(User.UserRole.ADMIN);
                adminUser.setActive(true);
                adminUser.setApprovalStatus(User.ApprovalStatus.APPROVED);
                
                // Save admin user
                userRepository.save(adminUser);
                
                System.out.println("Admin user created with email: " + adminEmail);
            } else {
                System.out.println("Admin user already exists with email: " + adminEmail);
            }
        };
    }
}