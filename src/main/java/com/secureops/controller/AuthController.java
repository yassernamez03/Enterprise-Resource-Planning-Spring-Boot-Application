package com.secureops.controller;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.validation.BindingResult;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

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

    // TODO: Replace with Redis/Database for production scalability
    private static final ConcurrentHashMap<String, AtomicInteger> loginAttempts = new ConcurrentHashMap<>();
    private static final ConcurrentHashMap<String, LocalDateTime> lastAttemptTime = new ConcurrentHashMap<>();
    
    @Value("${app.security.max-login-attempts:5}")
    private int maxLoginAttempts;
    
    @Value("${app.security.lockout-duration-minutes:15}")
    private int lockoutDurationMinutes;

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
        String email = loginDto.getEmail();

        logger.debug("Login request received for email: {} from IP: {}", email, clientIp);
        // securityLogger.info("AUTHENTICATION_ATTEMPT user={} ip={}", email, clientIp);

        try {
            if (isAccountLocked(email, clientIp)) {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                        .body(Map.of("message", "Account temporarily locked due to too many failed attempts"));
            }

            validateRequest(loginDto.getEmail(), loginDto.getPassword(), 
                          loginDto.getRecaptchaResponse(), clientIp, bindingResult);

            // Proceed with authentication
            var authResponse = authService.login(loginDto);
            logger.info("Authentication successful for user: {} IP: {}", email, clientIp);
            // securityLogger.info("AUTHENTICATION_SUCCESS user={} ip={}", email, clientIp);
            clearFailedAttempts(email, clientIp);
            return ResponseEntity.ok(authResponse);

        } catch (UnauthorizedException ex) {
            recordFailedAttempt(email, clientIp);
            logger.error("Authentication failed for user: {} Bad credentials", email);
            securityLogger.error("AUTHENTICATION_FAILURE user={} ip={} error={}", email, clientIp, ex.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", ex.getMessage()));
        } catch (BadRequestException ex) {
            logger.warn("Failed login attempt for user '{}': {}", email, ex.getMessage());
            securityLogger.warn("Login error - email: {}, IP: {}, Error: {}", email, clientIp, ex.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        } catch (Exception ex) {
            logger.error("Login error - email: {}, IP: {}, Error: {}", email, clientIp, ex.getMessage());
            securityLogger.error("Login error - email: {}, IP: {}, Error: {}", email, clientIp, ex.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "An unexpected error occurred"));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody UserRegistrationDto registrationDto,
            BindingResult bindingResult) {
        String clientIp = getClientIp();
        String email = registrationDto.getEmail();

        logger.debug("Registration request received for email: {} from IP: {}", email, clientIp);
        // securityLogger.info("REGISTRATION_ATTEMPT user={} ip={}", email, clientIp);

        try {
            validateRequest(registrationDto.getEmail(), null, 
                          registrationDto.getRecaptchaResponse(), clientIp, bindingResult);
            
            validateRequiredField(registrationDto.getFullName(), "Full name");
            validateInputSecurity(registrationDto.getFullName(), clientIp);

            // Proceed with registration
            userService.register(registrationDto);
            logger.info("Registration successful for user: {} IP: {}", email, clientIp);
            // securityLogger.info("REGISTRATION_SUCCESS user={} ip={}", email, clientIp);

            return new ResponseEntity<>(
                    Map.of("message", "User registered successfully. Please wait for admin approval."),
                    HttpStatus.CREATED);

        } catch (BadRequestException ex) {
            logger.warn("Registration validation failed for user '{}': {}", email, ex.getMessage());
            securityLogger.warn("Registration error - email: {}, IP: {}, Error: {}", email, clientIp, ex.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        } catch (Exception ex) {
            logger.error("Registration error - email: {}, IP: {}, Error: {}", email, clientIp, ex.getMessage());
            securityLogger.error("Registration error - email: {}, IP: {}, Error: {}", email, clientIp, ex.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "An unexpected error occurred"));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody PasswordResetRequestDto resetRequestDto,
            BindingResult bindingResult) {
        String clientIp = getClientIp();
        String email = resetRequestDto.getEmail();

        logger.debug("Password reset request received for email: {} from IP: {}", email, clientIp);
        // securityLogger.info("PASSWORD_RESET_ATTEMPT user={} ip={}", email, clientIp);

        try {
            validateRequest(resetRequestDto.getEmail(), null, 
                          resetRequestDto.getRecaptchaResponse(), clientIp, bindingResult);

            // Proceed with password reset
            userService.sendPasswordResetCode(resetRequestDto.getEmail());
            logger.info("Password reset code sent for user: {} IP: {}", email, clientIp);
            // securityLogger.info("PASSWORD_RESET_CODE_SENT user={} ip={}", email, clientIp);

            return ResponseEntity.ok(Map.of(
                    "message", "If your email is registered, you will receive a verification code shortly."));

        } catch (Exception ex) {
            logger.error("Password reset error - email: {}, IP: {}, Error: {}", email, clientIp, ex.getMessage());
            securityLogger.error("Password reset error - email: {}, IP: {}, Error: {}", email, clientIp,
                    ex.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "An unexpected error occurred"));
        }
    }

    @PostMapping("/verify-reset-code")
    public ResponseEntity<?> verifyResetCode(@Valid @RequestBody VerificationCodeDto verificationDto,
            BindingResult bindingResult) {
        String clientIp = getClientIp();
        String email = verificationDto.getEmail();

        logger.debug("Password reset verification request received for email: {} from IP: {}", email, clientIp);
        // securityLogger.info("PASSWORD_RESET_VERIFICATION_ATTEMPT user={} ip={}", email, clientIp);

        try {
            // Validation
            if (bindingResult.hasErrors()) {
                throw new BadRequestException("Invalid input data");
            }

            validateRequiredField(verificationDto.getEmail(), "Email");
            validateRequiredField(verificationDto.getVerificationCode(), "Verification code");
            validateInputSecurity(email, clientIp);
            validateVerificationCode(verificationDto.getVerificationCode(), clientIp);

            logger.debug("Attempting to verify reset code for email: {}", email);

            boolean result = userService.verifyAndResetPassword(
                    verificationDto.getEmail(),
                    verificationDto.getVerificationCode());

            if (result) {
                logger.info("Password reset verification successful for user: {} IP: {}", email, clientIp);
                // securityLogger.info("PASSWORD_RESET_SUCCESS user={} ip={}", email, clientIp);
                return ResponseEntity.ok(Map.of(
                        "message", "Password has been reset successfully. Check your email for new credentials."));
            } else {
                logger.warn("Password reset verification failed for user '{}': Invalid or expired verification code",
                        email);
                securityLogger.warn("Failed password reset verification - email: {}, IP: {}", email, clientIp);
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "Invalid or expired verification code."));
            }

        } catch (Exception ex) {
            logger.error("Password reset verification error - email: {}, IP: {}, Error: {}", email, clientIp,
                    ex.getMessage());
            securityLogger.error("Password reset verification error - email: {}, IP: {}, Error: {}", email, clientIp,
                    ex.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "An unexpected error occurred"));
        }
    }

    // ============== HELPER METHODS ==============

    private void validateRequest(String email, String password, String recaptchaResponse, 
                               String clientIp, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            throw new BadRequestException("Invalid input data");
        }

        validateRequiredField(email, "Email");
        if (password != null) {
            validateRequiredField(password, "Password");
        }
        validateRequiredField(recaptchaResponse, "reCAPTCHA verification");

        validateInputSecurity(email, clientIp);
        validateRecaptcha(recaptchaResponse, email, clientIp);
    }

    private void validateRequiredField(String value, String fieldName) {
        if (value == null || value.trim().isEmpty()) {
            throw new BadRequestException(fieldName + " is required");
        }
    }

    private void validateRecaptcha(String recaptchaResponse, String email, String clientIp) {
        logger.debug("Validating reCAPTCHA for email: {}, IP: {}", email, clientIp);
        if (!recaptchaService.validateCaptcha(recaptchaResponse)) {
            securityLogger.warn("Failed reCAPTCHA validation - email: {}, IP: {}", email, clientIp);
            throw new BadRequestException("reCAPTCHA validation failed");
        }
        logger.debug("reCAPTCHA validated successfully for email: {}", email);
    }

    private void validateVerificationCode(String verificationCode, String clientIp) {
        if (containsSqlInjectionPatterns(verificationCode) || containsXssPatterns(verificationCode)) {
            securityLogger.error("Malicious verification code attempt - Code: {} IP: {}", verificationCode, clientIp);
            throw new BadRequestException("Invalid verification code format");
        }

        if (!verificationCode.matches("\\d{6}")) {
            securityLogger.warn("Invalid verification code format - IP: {}", clientIp);
            throw new BadRequestException("Invalid verification code format");
        }
    }

    private String getClientIp() {
        try {
            HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes())
                    .getRequest();
            
            // Check multiple headers for real IP
            String[] headers = {"X-Forwarded-For", "Proxy-Client-IP", "WL-Proxy-Client-IP", 
                              "HTTP_X_FORWARDED_FOR", "HTTP_X_FORWARDED", "HTTP_X_CLUSTER_CLIENT_IP", 
                              "HTTP_CLIENT_IP", "HTTP_FORWARDED_FOR", "HTTP_FORWARDED", "HTTP_VIA", 
                              "REMOTE_ADDR"};
            
            for (String header : headers) {
                String ipAddress = request.getHeader(header);
                if (ipAddress != null && !ipAddress.isEmpty() && !"unknown".equalsIgnoreCase(ipAddress)) {
                    // For X-Forwarded-For, take the first IP
                    if (header.equals("X-Forwarded-For") && ipAddress.contains(",")) {
                        ipAddress = ipAddress.split(",")[0].trim();
                    }
                    logger.debug("Client IP retrieved from {}: {}", header, ipAddress);
                    return ipAddress;
                }
            }
            
            String remoteAddr = request.getRemoteAddr();
            logger.debug("Client IP retrieved from RemoteAddr: {}", remoteAddr);
            return remoteAddr;
            
        } catch (IllegalStateException e) {
            logger.debug("No HTTP request context available, returning unknown IP");
            return "unknown";
        } catch (Exception ex) {
            logger.error("Error retrieving client IP", ex);
            return "unknown";
        }
    }

    private boolean isAccountLocked(String email, String clientIp) {
        String key = email + ":" + clientIp;
        AtomicInteger attempts = loginAttempts.get(key);
        LocalDateTime lastAttempt = lastAttemptTime.get(key);

        if (attempts != null && lastAttempt != null) {
            long minutesSinceLastAttempt = ChronoUnit.MINUTES.between(lastAttempt, LocalDateTime.now());

            if (attempts.get() >= maxLoginAttempts && minutesSinceLastAttempt < lockoutDurationMinutes) {
                securityLogger.error("Account locked - User: {} IP: {} Reason: Too many failed attempts", email, clientIp);
                return true;
            }

            // Reset counter if lockout period has passed
            if (minutesSinceLastAttempt >= lockoutDurationMinutes) {
                loginAttempts.remove(key);
                lastAttemptTime.remove(key);
            }
        }
        return false;
    }

    private void recordFailedAttempt(String email, String clientIp) {
        String key = email + ":" + clientIp;
        loginAttempts.computeIfAbsent(key, k -> new AtomicInteger(0)).incrementAndGet();
        lastAttemptTime.put(key, LocalDateTime.now());

        int attempts = loginAttempts.get(key).get();
        securityLogger.warn("Multiple failed login attempts - Username: {} Source: {} Attempts: {}", 
                           email, clientIp, attempts);
    }

    private void clearFailedAttempts(String email, String clientIp) {
        String key = email + ":" + clientIp;
        loginAttempts.remove(key);
        lastAttemptTime.remove(key);
    }

    private boolean containsSqlInjectionPatterns(String input) {
        if (input == null) return false;
        String lowerInput = input.toLowerCase();
        String[] sqlPatterns = {"'", "\"", ";", "--", "/*", "*/", "union", "select", "insert", 
                               "update", "delete", "drop", "exec", "script", "xp_", "sp_"};

        for (String pattern : sqlPatterns) {
            if (lowerInput.contains(pattern)) {
                return true;
            }
        }
        return false;
    }

    private boolean containsXssPatterns(String input) {
        if (input == null) return false;
        String lowerInput = input.toLowerCase();
        String[] xssPatterns = {"<script", "</script>", "javascript:", "onload=", "onclick=", "onerror=",
                               "onmouseover=", "eval(", "alert(", "confirm(", "prompt(", "document.cookie"};

        for (String pattern : xssPatterns) {
            if (lowerInput.contains(pattern)) {
                return true;
            }
        }
        return false;
    }

    private boolean containsPathTraversalPatterns(String input) {
        if (input == null) return false;
        return input.contains("../") || input.contains("..\\") || input.contains("/etc/") 
               || input.contains("\\windows\\") || input.contains("%2e%2e");
    }

    private void validateInputSecurity(String input, String clientIp) {
        if (containsSqlInjectionPatterns(input)) {
            securityLogger.error("SQL injection attempt - Input: {} IP: {}", input, clientIp);
            throw new BadRequestException("Invalid input detected");
        }

        if (containsXssPatterns(input)) {
            securityLogger.warn("XSS attempt detected - Input: {} IP: {}", input, clientIp);
            throw new BadRequestException("Invalid input detected");
        }

        if (containsPathTraversalPatterns(input)) {
            securityLogger.warn("Path traversal attempt - Input: {} IP: {}", input, clientIp);
            throw new BadRequestException("Invalid input detected");
        }
    }
}