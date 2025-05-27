package com.secureops.service;

import com.secureops.config.JwtTokenProvider;
import com.secureops.dto.JwtAuthResponse;
import com.secureops.dto.LoginDto;
import com.secureops.dto.UserDto;
import com.secureops.entity.User;
import com.secureops.exception.BadRequestException;
import com.secureops.exception.UnauthorizedException;
import com.secureops.repository.UserRepository;
import com.secureops.util.AppConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;

@Service
public class AuthServiceImpl implements AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthServiceImpl.class);
    
    // For security-specific logging, create a separate logger
    private static final Logger securityLogger = LoggerFactory.getLogger("com.secureops.security");

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtTokenProvider tokenProvider;
    private final LogService logService;

    public AuthServiceImpl(AuthenticationManager authenticationManager,
            UserRepository userRepository,
            JwtTokenProvider tokenProvider,
            LogService logService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.tokenProvider = tokenProvider;
        this.logService = logService;
        
        logger.info("AuthServiceImpl initialized");
    }

    @Override
    public JwtAuthResponse login(LoginDto loginDto) {
        String email = loginDto.getEmail();
        String clientIp = getClientIp();
        
        // Log login attempt - mask the email for privacy in logs
        logger.debug("Login attempt for user: {}", maskEmail(email));
        securityLogger.info("Login attempt from IP: {} for account: {}", clientIp, maskEmail(email));

        try {
            // Verify user exists
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> {
                        securityLogger.warn("Failed login attempt - user not found: {} from IP: {}", 
                                maskEmail(email), clientIp);
                        return new BadRequestException("Invalid credentials");
                    });

            logger.debug("User found - ID: {}, Role: {}, Active: {}, Status: {}", 
                    user.getId(), user.getRole(), user.isActive(), user.getApprovalStatus());

            // Check if user is approved and active
            if (user.getApprovalStatus() != User.ApprovalStatus.APPROVED || !user.isActive()) {
                securityLogger.warn("Login blocked - account not active or not approved - UserID: {}, Status: {}, Active: {}, IP: {}", 
                        user.getId(), user.getApprovalStatus(), user.isActive(), clientIp);
                throw new UnauthorizedException("User account is not active or pending approval");
            }

            // Authenticate user
            try {
                Authentication authentication = authenticationManager.authenticate(
                        new UsernamePasswordAuthenticationToken(
                                email,
                                loginDto.getPassword()));

                SecurityContextHolder.getContext().setAuthentication(authentication);

                // Generate JWT token
                String token = tokenProvider.generateToken(authentication);
                
                // Log successful authentication
                logger.info("User successfully authenticated - UserID: {}", user.getId());
                securityLogger.info("Successful login - UserID: {}, Role: {}, IP: {}", 
                        user.getId(), user.getRole(), clientIp);

                // Create user DTO
                UserDto userDto = new UserDto();
                userDto.setId(user.getId());
                userDto.setFullName(user.getFullName());
                userDto.setEmail(user.getEmail());
                userDto.setRole(user.getRole());
                userDto.setActive(user.isActive());
                userDto.setApprovalStatus(user.getApprovalStatus());

                // Log the login via custom LogService
                logService.createLog(
                        AppConstants.LOG_ACTION_LOGIN,
                        "User logged in: " + email,
                        clientIp,
                        AppConstants.LOG_TYPE_AUTH,
                        user.getId());

                logger.debug("JWT token generated for user: {}", user.getId());
                
                return new JwtAuthResponse(token, userDto);
                
            } catch (Exception ex) {
                // Log authentication failure
                logger.error("Authentication failed for user: {}", maskEmail(email), ex);
                securityLogger.warn("Authentication failed - UserID: {}, IP: {}, Reason: {}", 
                        user.getId(), clientIp, ex.getMessage());
                throw ex;
            }
        } catch (BadRequestException | UnauthorizedException ex) {
            // Re-throw these exceptions since they're already logged
            throw ex;
        } catch (Exception ex) {
            // Log unexpected errors
            logger.error("Unexpected error during login process for user: {}", maskEmail(email), ex);
            securityLogger.error("Login process error - Email: {}, IP: {}, Error: {}", 
                    maskEmail(email), clientIp, ex.getMessage());
            throw ex;
        }
    }

    @Override
    public boolean validateToken(String token) {
        boolean isValid = tokenProvider.validateToken(token);
        
        if (isValid) {
            String username = tokenProvider.getUsernameFromToken(token);
            logger.debug("Token validated successfully for user: {}", maskEmail(username));
        } else {
            String tokenPreview = token.length() > 10 ? token.substring(0, 10) + "..." : token;
            logger.warn("Invalid token detected: {}", tokenPreview);
            securityLogger.warn("Invalid token validation attempt from IP: {}", getClientIp());
        }
        
        return isValid;
    }

    @Override
    public String getUsernameFromToken(String token) {
        String username = tokenProvider.getUsernameFromToken(token);
        logger.debug("Username extracted from token: {}", maskEmail(username));
        return username;
    }

    private String getClientIp() {
        try {
            HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes())
                    .getRequest();
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
            return email; // Return original if it's not a valid email format
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