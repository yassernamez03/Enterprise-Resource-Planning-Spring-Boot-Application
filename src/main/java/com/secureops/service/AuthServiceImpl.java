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
    }

    @Override
    public JwtAuthResponse login(LoginDto loginDto) {
        System.out.println("Login attempt for email: " + loginDto.getEmail());

        // Verify user exists
        User user = userRepository.findByEmail(loginDto.getEmail())
                .orElseThrow(() -> new BadRequestException("Invalid credentials"));

        System.out.println("User found with ID: " + user.getId() + ", Role: " + user.getRole() + ", Active: "
                + user.isActive() + ", Status: " + user.getApprovalStatus());

        // Check if user is approved and active
        if (user.getApprovalStatus() != User.ApprovalStatus.APPROVED || !user.isActive()) {
            throw new UnauthorizedException("User account is not active or pending approval");
        }

        // Authenticate user
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginDto.getEmail(),
                        loginDto.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);

        // Generate JWT token
        String token = tokenProvider.generateToken(authentication);

        // Create user DTO
        UserDto userDto = new UserDto();
        userDto.setId(user.getId());
        userDto.setFullName(user.getFullName());
        userDto.setEmail(user.getEmail());
        userDto.setRole(user.getRole());
        userDto.setActive(user.isActive());
        userDto.setApprovalStatus(user.getApprovalStatus());

        // Log the login
        logService.createLog(
                AppConstants.LOG_ACTION_LOGIN,
                "User logged in: " + user.getEmail(),
                getClientIp(),
                AppConstants.LOG_TYPE_AUTH,
                user.getId());

        return new JwtAuthResponse(token, userDto);
    }

    @Override
    public boolean validateToken(String token) {
        return tokenProvider.validateToken(token);
    }

    @Override
    public String getUsernameFromToken(String token) {
        return tokenProvider.getUsernameFromToken(token);
    }

    private String getClientIp() {
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
    }
}