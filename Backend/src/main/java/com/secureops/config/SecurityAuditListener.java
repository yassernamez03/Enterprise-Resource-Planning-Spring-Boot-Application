package com.secureops.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.security.authentication.event.*;
import org.springframework.stereotype.Component;

@Component
public class SecurityAuditListener {
    private static final Logger securityLogger = LoggerFactory.getLogger("org.springframework.security.audit");

    @EventListener
    public void onSuccess(AuthenticationSuccessEvent event) {
        securityLogger.info("User '{}' logged in successfully", 
                event.getAuthentication().getName());
    }

    @EventListener
    public void onFailure(AbstractAuthenticationFailureEvent event) {
        securityLogger.warn("Failed login attempt for user '{}': {}", 
                event.getAuthentication().getName(),
                event.getException().getMessage());
    }

    @EventListener
    public void onLogout(LogoutSuccessEvent event) {
        securityLogger.info("User '{}' logged out", 
                event.getAuthentication().getName());
    }
}