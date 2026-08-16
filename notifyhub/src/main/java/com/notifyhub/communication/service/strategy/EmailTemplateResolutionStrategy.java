package com.notifyhub.communication.service.strategy;

import com.notifyhub.communication.dto.TemplateResolutionResult;
import com.notifyhub.core.entity.template.EmailTemplate;
import com.notifyhub.core.repository.template.EmailTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class EmailTemplateResolutionStrategy implements TemplateResolutionStrategy {

    private final EmailTemplateRepository emailTemplateRepository;

    @Override
    public String getChannel() {
        return "EMAIL";
    }

    @Override
    public TemplateResolutionResult resolveTemplate(String templateCode) {
        EmailTemplate tpl = emailTemplateRepository.findByTemplateCode(templateCode).orElse(null);
        if (tpl == null) return null;

        return TemplateResolutionResult.builder()
                .templateCode(tpl.getTemplateCode())
                .content(tpl.getHtmlContent())
                .cssContent(tpl.getCssContent())
                .subject(tpl.getSubject())
                .documentTemplates(tpl.getDocumentTemplates())
                .build();
    }
}
