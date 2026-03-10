package com.secureops.service;

import com.secureops.dto.JwtAuthResponse;
import com.secureops.dto.LoginDto;

public interface AuthService {
    JwtAuthResponse login(LoginDto loginDto);
    boolean validateToken(String token);
    String getUsernameFromToken(String token);
}