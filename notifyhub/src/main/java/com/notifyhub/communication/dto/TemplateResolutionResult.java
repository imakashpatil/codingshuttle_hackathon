package com.notifyhub.communication.dto;

import com.notifyhub.core.entity.template.DocumentTemplate;
import lombok.Builder;
import lombok.Getter;
import java.util.List;

@Getter
@Builder
public class TemplateResolutionResult {
    private final String templateCode;
    private final String content;
    private final String cssContent;
    private final String subject;
    private final List<DocumentTemplate> documentTemplates;
}
