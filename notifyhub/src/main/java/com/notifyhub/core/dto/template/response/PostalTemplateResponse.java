package com.notifyhub.core.dto.template.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
public class PostalTemplateResponse {

    private UUID id;

    private String templateCode;

    private String templateName;

    private Integer version;

    private List<DocumentTemplateResponse> documentTemplates;

    private Boolean active;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
