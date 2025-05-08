package com.secureops.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketChannelInterceptor channelInterceptor;

    public WebSocketConfig(WebSocketChannelInterceptor channelInterceptor) {
        this.channelInterceptor = channelInterceptor;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Register STOMP endpoints with SockJS fallback
        registry.addEndpoint("/ws")
                .setAllowedOrigins(
                        "http://localhost:5175",  // Your React app's origin
                        "http://localhost:5174",  // Your React app's origin
                        "http://localhost:5173",
                        "http://192.168.0.*:5174")
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Prefix for messages going from client to server
        registry.setApplicationDestinationPrefixes("/app");

        // Prefix for messages going from server to client
        registry.enableSimpleBroker("/topic", "/queue");

        // Enable user-specific destinations (/user/...)
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Add our custom interceptor for authentication
        registration.interceptors(channelInterceptor);
    }
}