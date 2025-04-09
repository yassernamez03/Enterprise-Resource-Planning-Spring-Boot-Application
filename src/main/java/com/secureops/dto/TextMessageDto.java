package com.secureops.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class TextMessageDto extends MessageDto {
    
    @NotEmpty(message = "Message content is required")
    private String content;
    
    public TextMessageDto(Long id, String content) {
        super();
        this.setId(id);
        this.content = content;
        this.setMessageType("TEXT");
    }
}