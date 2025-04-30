package com.secureops.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.secureops.dto.LoginDto;
import com.secureops.dto.PasswordResetRequestDto;
import com.secureops.dto.UserRegistrationDto;
import com.secureops.dto.VerificationCodeDto;
import com.secureops.service.AuthService;
import com.secureops.service.RecaptchaService;
import com.secureops.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;
    private final RecaptchaService recaptchaService;

    public AuthController(AuthService authService, UserService userService, RecaptchaService recaptchaService) {
        this.authService = authService;
        this.userService = userService;
        this.recaptchaService = recaptchaService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginDto loginDto) {
        // Verify reCAPTCHA first
        if (!recaptchaService.validateCaptcha(loginDto.getRecaptchaResponse())) {
            return ResponseEntity.badRequest().body(Map.of("message", "reCAPTCHA validation failed"));
        }
        
        return ResponseEntity.ok(authService.login(loginDto));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody UserRegistrationDto registrationDto) {
        // Verify reCAPTCHA first
        if (!recaptchaService.validateCaptcha(registrationDto.getRecaptchaResponse())) {
            return ResponseEntity.badRequest().body(Map.of("message", "reCAPTCHA validation failed"));
        }
        
        userService.register(registrationDto);
        return new ResponseEntity<>(Map.of("message", "User registered successfully. Please wait for admin approval."),
                HttpStatus.CREATED);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody PasswordResetRequestDto resetRequestDto) {
        // Verify reCAPTCHA first
        if (!recaptchaService.validateCaptcha(resetRequestDto.getRecaptchaResponse())) {
            return ResponseEntity.badRequest().body(Map.of("message", "reCAPTCHA validation failed"));
        }
        
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