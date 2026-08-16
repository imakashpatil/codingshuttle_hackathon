package com.notifyhub.core.dto.communication.response;

import com.notifyhub.core.dto.template.response.DocumentTemplateResponse;
import com.notifyhub.core.enums.CommunicationChannel;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
public class CommunicationDefinitionResponse {

    private UUID id;

    private String communicationCode;

    private String name;

    private String description;

    private Integer version;

    private Boolean active;

    private List<ChannelResponse> channels;

    private PayloadResponse payload;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @Getter
    @Builder
    public static class ChannelResponse {

        private UUID id;

        private CommunicationChannel channel;

        private UUID templateId;

        private String templateCode;

        private String templateName;

        private Boolean enabled;

        private Integer priority;

        private TemplateDetailResponse template;
    }

    @Getter
    @Builder
    public static class TemplateDetailResponse {

        private UUID id;

        private String templateCode;

        private String templateName;

        private String templateType;

        private String subject;

        private String message;

        private String htmlContent;

        private String cssContent;

        private String xmlPayloadFormat;

        private List<DocumentTemplateResponse> documentTemplates;
    }

    @Getter
    @Builder
    public static class PayloadResponse {

        private UUID id;

        private String xmlSchema;

        private String sampleXml;

        private Integer version;

        private LocalDateTime createdAt;

        private LocalDateTime updatedAt;
    }
}