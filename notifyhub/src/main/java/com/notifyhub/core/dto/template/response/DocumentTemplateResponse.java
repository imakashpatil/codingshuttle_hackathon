package com.notifyhub.core.dto.template.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
public class DocumentTemplateResponse {

    private UUID id;

    private String templateCode;

    private String templateName;

    private String htmlContent;

    private String cssContent;

    private String xmlPayloadFormat;

    private Integer version;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
