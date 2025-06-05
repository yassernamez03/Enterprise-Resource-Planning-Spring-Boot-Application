package com.secureops.controller;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.validation.BindingResult;

import com.secureops.dto.LoginDto;
import com.secureops.dto.PasswordResetRequestDto;
import com.secureops.dto.UserRegistrationDto;
import com.secureops.dto.VerificationCodeDto;
import com.secureops.exception.BadRequestException;
import com.secureops.exception.UnauthorizedException;
import com.secureops.service.AuthService;
import com.secureops.service.RecaptchaService;
import com.secureops.service.UserService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    private static final Logger securityLogger = LoggerFactory.getLogger("com.secureops.security");

    private final AuthService authService;
    private final UserService userService;
    private final RecaptchaService recaptchaService;

    public AuthController(AuthService authService, UserService userService, RecaptchaService recaptchaService) {
        this.authService = authService;
        this.userService = userService;
        this.recaptchaService = recaptchaService;
        logger.info("AuthController initialized");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginDto loginDto, BindingResult bindingResult) {
        String clientIp = getClientIp();
        String maskedEmail = maskEmail(loginDto.getEmail());
        
        logger.debug("Login request received for email: {} from IP: {}", maskedEmail, clientIp);
        securityLogger.info("Login attempt from IP: {} for account: {}", clientIp, maskedEmail);

        try {
            // Check for validation errors
            if (bindingResult.hasErrors()) {
                logger.warn("Login validation failed for email: {} from IP: {}. Errors: {}", 
                        maskedEmail, clientIp, bindingResult.getAllErrors());
                securityLogger.warn("Login validation failure - email: {}, IP: {}", maskedEmail, clientIp);
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid input data"));
            }

            // Validate required fields
            if (loginDto.getEmail() == null || loginDto.getEmail().trim().isEmpty()) {
                logger.warn("Login attempt with empty email from IP: {}", clientIp);
                securityLogger.warn("Login attempt with empty email from IP: {}", clientIp);
                return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
            }

            if (loginDto.getPassword() == null || loginDto.getPassword().trim().isEmpty()) {
                logger.warn("Login attempt with empty password for email: {} from IP: {}", maskedEmail, clientIp);
                securityLogger.warn("Login attempt with empty password - email: {}, IP: {}", maskedEmail, clientIp);
                return ResponseEntity.badRequest().body(Map.of("message", "Password is required"));
            }

            if (loginDto.getRecaptchaResponse() == null || loginDto.getRecaptchaResponse().trim().isEmpty()) {
                logger.warn("Login attempt without reCAPTCHA for email: {} from IP: {}", maskedEmail, clientIp);
                securityLogger.warn("Login attempt without reCAPTCHA - email: {}, IP: {}", maskedEmail, clientIp);
                return ResponseEntity.badRequest().body(Map.of("message", "reCAPTCHA verification is required"));
            }

            // Verify reCAPTCHA first
            logger.debug("Validating reCAPTCHA for login attempt - email: {}, IP: {}", maskedEmail, clientIp);
            if (!recaptchaService.validateCaptcha(loginDto.getRecaptchaResponse())) {
                logger.warn("reCAPTCHA validation failed for login - email: {}, IP: {}", maskedEmail, clientIp);
                securityLogger.warn("Failed reCAPTCHA validation for login - email: {}, IP: {}", maskedEmail, clientIp);
                return ResponseEntity.badRequest().body(Map.of("message", "reCAPTCHA validation failed"));
            }

            logger.debug("reCAPTCHA validated successfully for email: {}", maskedEmail);
            
            // Proceed with authentication
            var authResponse = authService.login(loginDto);
            logger.info("Login successful for email: {} from IP: {}", maskedEmail, clientIp);
            securityLogger.info("Successful login - email: {}, IP: {}", maskedEmail, clientIp);
            
            return ResponseEntity.ok(authResponse);

        } catch (UnauthorizedException ex) {
            logger.warn("Unauthorized login attempt for email: {} from IP: {}. Reason: {}", 
                    maskedEmail, clientIp, ex.getMessage());
            securityLogger.warn("Unauthorized login attempt - email: {}, IP: {}, Reason: {}", 
                    maskedEmail, clientIp, ex.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", ex.getMessage()));
        } catch (BadRequestException ex) {
            logger.warn("Bad request for login - email: {} from IP: {}. Reason: {}", 
                    maskedEmail, clientIp, ex.getMessage());
            securityLogger.warn("Bad login request - email: {}, IP: {}, Reason: {}", 
                    maskedEmail, clientIp, ex.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        } catch (Exception ex) {
            logger.error("Unexpected error during login for email: {} from IP: {}", maskedEmail, clientIp, ex);
            securityLogger.error("Login error - email: {}, IP: {}, Error: {}", 
                    maskedEmail, clientIp, ex.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "An unexpected error occurred"));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody UserRegistrationDto registrationDto, BindingResult bindingResult) {
        String clientIp = getClientIp();
        String maskedEmail = maskEmail(registrationDto.getEmail());
        
        logger.debug("Registration request received for email: {} from IP: {}", maskedEmail, clientIp);
        securityLogger.info("Registration attempt from IP: {} for account: {}", clientIp, maskedEmail);

        try {
            // Check for validation errors
            if (bindingResult.hasErrors()) {
                logger.warn("Registration validation failed for email: {} from IP: {}. Errors: {}", 
                        maskedEmail, clientIp, bindingResult.getAllErrors());
                securityLogger.warn("Registration validation failure - email: {}, IP: {}", maskedEmail, clientIp);
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid input data"));
            }

            // Validate required fields
            if (registrationDto.getEmail() == null || registrationDto.getEmail().trim().isEmpty()) {
                logger.warn("Registration attempt with empty email from IP: {}", clientIp);
                securityLogger.warn("Registration attempt with empty email from IP: {}", clientIp);
                return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
            }

            if (registrationDto.getFullName() == null || registrationDto.getFullName().trim().isEmpty()) {
                logger.warn("Registration attempt with empty full name for email: {} from IP: {}", maskedEmail, clientIp);
                securityLogger.warn("Registration attempt with empty full name - email: {}, IP: {}", maskedEmail, clientIp);
                return ResponseEntity.badRequest().body(Map.of("message", "Full name is required"));
            }

            if (registrationDto.getRecaptchaResponse() == null || registrationDto.getRecaptchaResponse().trim().isEmpty()) {
                logger.warn("Registration attempt without reCAPTCHA for email: {} from IP: {}", maskedEmail, clientIp);
                securityLogger.warn("Registration attempt without reCAPTCHA - email: {}, IP: {}", maskedEmail, clientIp);
                return ResponseEntity.badRequest().body(Map.of("message", "reCAPTCHA verification is required"));
            }

            // Verify reCAPTCHA first
            logger.debug("Validating reCAPTCHA for registration attempt - email: {}, IP: {}", maskedEmail, clientIp);
            if (!recaptchaService.validateCaptcha(registrationDto.getRecaptchaResponse())) {
                logger.warn("reCAPTCHA validation failed for registration - email: {}, IP: {}", maskedEmail, clientIp);
                securityLogger.warn("Failed reCAPTCHA validation for registration - email: {}, IP: {}", maskedEmail, clientIp);
                return ResponseEntity.badRequest().body(Map.of("message", "reCAPTCHA validation failed"));
            }

            logger.debug("reCAPTCHA validated successfully for registration - email: {}", maskedEmail);
            
            // Proceed with registration
            userService.register(registrationDto);
            logger.info("Registration successful for email: {} from IP: {}", maskedEmail, clientIp);
            securityLogger.info("Successful registration - email: {}, IP: {}", maskedEmail, clientIp);
            
            return new ResponseEntity<>(Map.of("message", "User registered successfully. Please wait for admin approval."),
                    HttpStatus.CREATED);

        } catch (BadRequestException ex) {
            logger.warn("Bad request for registration - email: {} from IP: {}. Reason: {}", 
                    maskedEmail, clientIp, ex.getMessage());
            securityLogger.warn("Bad registration request - email: {}, IP: {}, Reason: {}", 
                    maskedEmail, clientIp, ex.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        } catch (Exception ex) {
            logger.error("Unexpected error during registration for email: {} from IP: {}", maskedEmail, clientIp, ex);
            securityLogger.error("Registration error - email: {}, IP: {}, Error: {}", 
                    maskedEmail, clientIp, ex.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "An unexpected error occurred"));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody PasswordResetRequestDto resetRequestDto, BindingResult bindingResult) {
        String clientIp = getClientIp();
        String maskedEmail = maskEmail(resetRequestDto.getEmail());
        
        logger.debug("Password reset request received for email: {} from IP: {}", maskedEmail, clientIp);
        securityLogger.info("Password reset attempt from IP: {} for account: {}", clientIp, maskedEmail);

        try {
            // Check for validation errors
            if (bindingResult.hasErrors()) {
                logger.warn("Password reset validation failed for email: {} from IP: {}. Errors: {}", 
                        maskedEmail, clientIp, bindingResult.getAllErrors());
                securityLogger.warn("Password reset validation failure - email: {}, IP: {}", maskedEmail, clientIp);
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid input data"));
            }

            // Validate required fields
            if (resetRequestDto.getEmail() == null || resetRequestDto.getEmail().trim().isEmpty()) {
                logger.warn("Password reset attempt with empty email from IP: {}", clientIp);
                securityLogger.warn("Password reset attempt with empty email from IP: {}", clientIp);
                return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
            }

            if (resetRequestDto.getRecaptchaResponse() == null || resetRequestDto.getRecaptchaResponse().trim().isEmpty()) {
                logger.warn("Password reset attempt without reCAPTCHA for email: {} from IP: {}", maskedEmail, clientIp);
                securityLogger.warn("Password reset attempt without reCAPTCHA - email: {}, IP: {}", maskedEmail, clientIp);
                return ResponseEntity.badRequest().body(Map.of("message", "reCAPTCHA verification is required"));
            }

            // Verify reCAPTCHA first
            logger.debug("Validating reCAPTCHA for password reset attempt - email: {}, IP: {}", maskedEmail, clientIp);
            if (!recaptchaService.validateCaptcha(resetRequestDto.getRecaptchaResponse())) {
                logger.warn("reCAPTCHA validation failed for password reset - email: {}, IP: {}", maskedEmail, clientIp);
                securityLogger.warn("Failed reCAPTCHA validation for password reset - email: {}, IP: {}", maskedEmail, clientIp);
                return ResponseEntity.badRequest().body(Map.of("message", "reCAPTCHA validation failed"));
            }

            logger.debug("reCAPTCHA validated successfully for password reset - email: {}", maskedEmail);
            
            // Proceed with password reset
            userService.sendPasswordResetCode(resetRequestDto.getEmail());
            logger.info("Password reset code sent for email: {} from IP: {}", maskedEmail, clientIp);
            securityLogger.info("Password reset code sent - email: {}, IP: {}", maskedEmail, clientIp);

            return ResponseEntity.ok(Map.of(
                    "message", "If your email is registered, you will receive a verification code shortly."));

        } catch (Exception ex) {
            logger.error("Unexpected error during password reset for email: {} from IP: {}", maskedEmail, clientIp, ex);
            securityLogger.error("Password reset error - email: {}, IP: {}, Error: {}", 
                    maskedEmail, clientIp, ex.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "An unexpected error occurred"));
        }
    }

    @PostMapping("/verify-reset-code")
    public ResponseEntity<?> verifyResetCode(@Valid @RequestBody VerificationCodeDto verificationDto, BindingResult bindingResult) {
        String clientIp = getClientIp();
        String maskedEmail = maskEmail(verificationDto.getEmail());
        
        logger.debug("Password reset verification request received for email: {} from IP: {}", maskedEmail, clientIp);
        securityLogger.info("Password reset verification attempt from IP: {} for account: {}", clientIp, maskedEmail);

        try {
            // Check for validation errors
            if (bindingResult.hasErrors()) {
                logger.warn("Password reset verification validation failed for email: {} from IP: {}. Errors: {}", 
                        maskedEmail, clientIp, bindingResult.getAllErrors());
                securityLogger.warn("Password reset verification validation failure - email: {}, IP: {}", maskedEmail, clientIp);
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid input data"));
            }

            // Validate required fields
            if (verificationDto.getEmail() == null || verificationDto.getEmail().trim().isEmpty()) {
                logger.warn("Password reset verification attempt with empty email from IP: {}", clientIp);
                securityLogger.warn("Password reset verification attempt with empty email from IP: {}", clientIp);
                return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
            }

            if (verificationDto.getVerificationCode() == null || verificationDto.getVerificationCode().trim().isEmpty()) {
                logger.warn("Password reset verification attempt with empty code for email: {} from IP: {}", maskedEmail, clientIp);
                securityLogger.warn("Password reset verification attempt with empty code - email: {}, IP: {}", maskedEmail, clientIp);
                return ResponseEntity.badRequest().body(Map.of("message", "Verification code is required"));
            }

            // Validate verification code format (should be 6 digits)
            if (!verificationDto.getVerificationCode().matches("\\d{6}")) {
                logger.warn("Invalid verification code format for email: {} from IP: {}", maskedEmail, clientIp);
                securityLogger.warn("Invalid verification code format - email: {}, IP: {}", maskedEmail, clientIp);
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid verification code format"));
            }

            logger.debug("Attempting to verify reset code for email: {}", maskedEmail);
            
            boolean result = userService.verifyAndResetPassword(
                    verificationDto.getEmail(),
                    verificationDto.getVerificationCode());

            if (result) {
                logger.info("Password reset verification successful for email: {} from IP: {}", maskedEmail, clientIp);
                securityLogger.info("Successful password reset verification - email: {}, IP: {}", maskedEmail, clientIp);
                return ResponseEntity.ok(Map.of(
                        "message", "Password has been reset successfully. Check your email for new credentials."));
            } else {
                logger.warn("Password reset verification failed for email: {} from IP: {}", maskedEmail, clientIp);
                securityLogger.warn("Failed password reset verification - email: {}, IP: {}", maskedEmail, clientIp);
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "Invalid or expired verification code."));
            }

        } catch (Exception ex) {
            logger.error("Unexpected error during password reset verification for email: {} from IP: {}", maskedEmail, clientIp, ex);
            securityLogger.error("Password reset verification error - email: {}, IP: {}, Error: {}", 
                    maskedEmail, clientIp, ex.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "An unexpected error occurred"));
        }
    }

    private String getClientIp() {
        try {
            HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
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
            logger.debug("Client IP retrieved: {}", ipAddress);
            return ipAddress;
        } catch (IllegalStateException e) {
            logger.debug("No HTTP request context available, returning unknown IP");
            return "unknown";
        } catch (Exception ex) {
            logger.error("Error retrieving client IP", ex);
            return "unknown";
        }
    }

    /**
     * Masks an email address for privacy in logs
     * Converts user@example.com to u***@e***.com
     */
    private String maskEmail(String email) {
        if (email == null || email.isEmpty() || !email.contains("@")) {
            return email;
        }

        String[] parts = email.split("@");
        String username = parts[0];
        String domain = parts[1];

        String maskedUsername = username.substring(0, 1) + "***";

        String[] domainParts = domain.split("\\.");
        String domainName = domainParts[0];
        String tld = domainParts.length > 1 ? domainParts[domainParts.length - 1] : "";

        String maskedDomain = domainName.substring(0, 1) + "***";

        return maskedUsername + "@" + maskedDomain + "." + tld;
    }
}