package com.secureops.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class FileMessageDto extends MessageDto {
    
    @NotEmpty(message = "File URL is required")
    private String fileUrl;
    
    @NotEmpty(message = "File name is required")
    private String fileName;
    
    private String fileType;
    private Long fileSize;
    
    public FileMessageDto(Long id, String fileUrl, String fileName, String fileType, Long fileSize) {
        super();
        this.setId(id);
        this.fileUrl = fileUrl;
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileSize = fileSize;
        this.setMessageType("FILE");
    }
}