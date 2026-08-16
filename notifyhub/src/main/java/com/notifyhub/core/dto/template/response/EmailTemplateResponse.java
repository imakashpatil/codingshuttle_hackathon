package com.notifyhub.core.dto.template.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
public class EmailTemplateResponse {

    private UUID id;

    private String templateCode;

    private String templateName;

    private String subject;

    private String htmlContent;

    private String cssContent;

    private String xmlPayloadFormat;

    private Integer version;

    private List<DocumentTemplateResponse> documentTemplates;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
