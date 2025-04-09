package com.secureops.controller;

import com.secureops.dto.JwtAuthResponse;
import com.secureops.dto.LoginDto;
import com.secureops.dto.UserRegistrationDto;
import com.secureops.service.AuthService;
import com.secureops.service.UserService;
import jakarta.validation.Valid;
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
        return new ResponseEntity<>("User registered successfully. Please wait for admin approval.", HttpStatus.CREATED);
    }
}