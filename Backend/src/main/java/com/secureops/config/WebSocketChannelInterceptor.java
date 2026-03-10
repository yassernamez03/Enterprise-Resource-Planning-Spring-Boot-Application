package com.secureops.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com.secureops.entity.User;
import com.secureops.repository.UserRepository;

import java.util.Collections;

@Component
public class WebSocketChannelInterceptor implements ChannelInterceptor {
    
    @Autowired
    private JwtTokenProvider jwtService;
    
    @Autowired
    private UserRepository userRepository;

    @Override
    public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            // Try to get token from headers
            String authHeader = accessor.getFirstNativeHeader("Authorization");
            String token = null;
            
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
                System.out.println("WebSocket token found in Authorization header");
            }
            
            // If no token in headers, try session attributes
            if (token == null) {
                // Get the HTTP session
                Object sessionId = accessor.getSessionAttributes() != null ? 
                    accessor.getSessionAttributes().get("sessionId") : null;
                    
                System.out.println("Session ID in WebSocket connection: " + sessionId);
            }
            
            // If token found, validate and set authentication
            if (token != null) {
                try {
                    // Validate token
                    boolean isValid = jwtService.validateToken(token);
                    
                    if (isValid) {
                        // Get username from token
                        String email = jwtService.getUsernameFromToken(token);
                        
                        // Find user in repository
                        User user = userRepository.findByEmail(email)
                            .orElseThrow(() -> new RuntimeException("User not found"));
                        
                        // Since User doesn't have getAuthorities(), create authority from user role
                        SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + user.getRole().name());
                        
                        // Create authentication object
                        Authentication auth = new UsernamePasswordAuthenticationToken(
                            email, null, Collections.singletonList(authority));
                        
                        // Set authentication in security context
                        SecurityContextHolder.getContext().setAuthentication(auth);
                        
                        // Set user in WebSocket session
                        accessor.setUser(auth);
                        
                        System.out.println("WebSocket authentication successful for user: " + email);
                    } else {
                        System.out.println("WebSocket token validation failed: Token is invalid");
                    }
                } catch (Exception e) {
                    System.out.println("WebSocket token validation error: " + e.getMessage());
                    e.printStackTrace();
                }
            } else {
                System.out.println("No token found in WebSocket connection request");
            }
        }
        
        return message;
    }
}