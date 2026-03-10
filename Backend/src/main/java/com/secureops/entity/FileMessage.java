package com.secureops.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "file_messages")
@DiscriminatorValue("FILE")
public class FileMessage extends Message {

    @Column(nullable = false)
    private String fileUrl;

    @Column(nullable = false)
    private String fileName;
    
    private String fileType;
    
    private Long fileSize;
}