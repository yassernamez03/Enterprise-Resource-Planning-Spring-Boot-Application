package com.secureops.controller;

import com.secureops.dto.JwtAuthResponse;
import com.secureops.dto.LoginDto;
import com.secureops.dto.PasswordResetRequestDto;
import com.secureops.dto.UserRegistrationDto;
import com.secureops.dto.VerificationCodeDto;
import com.secureops.service.AuthService;
import com.secureops.service.UserService;
import jakarta.validation.Valid;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    public AuthController(AuthService authService, UserService userService) {
        this.authService = authService;
        this.userService = userService;
    }

    @PostMapping("/login")
    public ResponseEntity<JwtAuthResponse> login(@Valid @RequestBody LoginDto loginDto) {
        return ResponseEntity.ok(authService.login(loginDto));
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@Valid @RequestBody UserRegistrationDto registrationDto) {
        userService.register(registrationDto);
        return new ResponseEntity<>("User registered successfully. Please wait for admin approval.",
                HttpStatus.CREATED);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody PasswordResetRequestDto resetRequestDto) {
        userService.sendPasswordResetCode(resetRequestDto.getEmail());

        return ResponseEntity.ok(Map.of(
                "message", "If your email is registered, you will receive a verification code shortly."));
    }

    @PostMapping("/verify-reset-code")
    public ResponseEntity<?> verifyResetCode(@Valid @RequestBody VerificationCodeDto verificationDto) {
        boolean result = userService.verifyAndResetPassword(
                verificationDto.getEmail(),
                verificationDto.getVerificationCode());

        if (result) {
            return ResponseEntity.ok(Map.of(
                    "message", "Password has been reset successfully. Check your email for new credentials."));
        } else {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Invalid or expired verification code."));
        }
    }
}