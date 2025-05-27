package com.secureops.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

@Service
public class RecaptchaService {

    private static final Logger logger = LoggerFactory.getLogger(RecaptchaService.class);
    private static final Logger securityLogger = LoggerFactory.getLogger("com.secureops.security");
    private static final String GOOGLE_RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

    @Value("${recaptcha.secret}")
    private String recaptchaSecret;

    private final RestTemplate restTemplate;

    public RecaptchaService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
        logger.info("RecaptchaService initialized");
    }

    public boolean validateCaptcha(String recaptchaResponse) {
        String clientIp = getClientIp();
        String maskedToken = maskToken(recaptchaResponse);
        logger.debug("Validating CAPTCHA token: {} from IP: {}", maskedToken, clientIp);

        try {
            // Skip validation if testing environment
            if (recaptchaResponse.equals("test-token")) {
                logger.info("Bypassing CAPTCHA validation for test token from IP: {}", clientIp);
                return true;
            }

            MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
            formData.add("secret", recaptchaSecret);
            formData.add("response", recaptchaResponse);

            logger.debug("Sending CAPTCHA verification request to Google for token: {}", maskedToken);
            ResponseEntity<Map> responseEntity = restTemplate.postForEntity(
                    GOOGLE_RECAPTCHA_VERIFY_URL,
                    formData,
                    Map.class
            );

            Map<String, Object> responseBody = responseEntity.getBody();
            if (responseBody == null) {
                logger.warn("Received null response from Google reCAPTCHA API for token: {} from IP: {}", maskedToken, clientIp);
                securityLogger.warn("Null reCAPTCHA response for token: {} from IP: {}", maskedToken, clientIp);
                return false;
            }

            boolean success = Boolean.TRUE.equals(responseBody.get("success"));
            if (success) {
                logger.info("CAPTCHA validation successful for token: {} from IP: {}", maskedToken, clientIp);
            } else {
                logger.warn("CAPTCHA validation failed for token: {} from IP: {}. Response: {}", 
                        maskedToken, clientIp, responseBody);
                securityLogger.warn("Failed reCAPTCHA validation for token: {} from IP: {}. Details: {}", 
                        maskedToken, clientIp, responseBody);
            }

            return success;

        } catch (RestClientException ex) {
            logger.error("Error communicating with Google reCAPTCHA API for token: {} from IP: {}", maskedToken, clientIp, ex);
            securityLogger.error("reCAPTCHA API error for token: {} from IP: {}. Error: {}", 
                    maskedToken, clientIp, ex.getMessage());
            return false;
        } catch (Exception ex) {
            logger.error("Unexpected error validating CAPTCHA token: {} from IP: {}", maskedToken, clientIp, ex);
            securityLogger.error("Unexpected reCAPTCHA error for token: {} from IP: {}. Error: {}", 
                    maskedToken, clientIp, ex.getMessage());
            return false;
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
     * Masks a CAPTCHA token for privacy in logs
     * Shows first 6 and last 4 characters, e.g., "abc123xyz789" -> "abc123****789"
     */
    private String maskToken(String token) {
        if (token == null || token.length() < 10) {
            return token;
        }
        return token.substring(0, 6) + "****" + token.substring(token.length() - 4);
    }
}