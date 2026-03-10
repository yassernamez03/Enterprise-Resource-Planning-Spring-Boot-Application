package com.secureops.dto;

public class TypingStatusDto {
    private Long userId;
    private boolean typing;
    
    // Getters and setters
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    
    public boolean isTyping() {
        return typing;
    }
    
    public void setTyping(boolean typing) {
        this.typing = typing;
    }
}