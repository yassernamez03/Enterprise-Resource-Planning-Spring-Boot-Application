package com.secureops.dto;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        property = "messageType")
@JsonSubTypes({
        @JsonSubTypes.Type(value = TextMessageDto.class, name = "TEXT"),
        @JsonSubTypes.Type(value = FileMessageDto.class, name = "FILE")
})
public abstract class MessageDto {
    private Long id;
    private Date timestamp;
    private boolean readStatus;
    private UserDto sender;
    private Long chatId;
    private String messageType;
}