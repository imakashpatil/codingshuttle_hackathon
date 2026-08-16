package com.notifyhub.core.dto.template.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
public class WhatsAppTemplateResponse {

    private UUID id;

    private String templateCode;

    private String templateName;

    private String message;

    private String xmlPayloadFormat;

    private Integer version;

    private List<DocumentTemplateResponse> documentTemplates;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}