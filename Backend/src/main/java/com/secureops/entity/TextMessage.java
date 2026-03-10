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
@Table(name = "text_messages")
@DiscriminatorValue("TEXT")
public class TextMessage extends Message {

    @Column(columnDefinition = "TEXT")
    private String content;
}