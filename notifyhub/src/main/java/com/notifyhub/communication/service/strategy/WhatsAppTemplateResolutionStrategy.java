package com.notifyhub.communication.service.strategy;

import com.notifyhub.communication.dto.TemplateResolutionResult;
import com.notifyhub.core.entity.template.WhatsAppTemplate;
import com.notifyhub.core.repository.template.WhatsAppTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class WhatsAppTemplateResolutionStrategy implements TemplateResolutionStrategy {

    private final WhatsAppTemplateRepository whatsAppTemplateRepository;

    @Override
    public String getChannel() {
        return "WHATSAPP";
    }

    @Override
    public TemplateResolutionResult resolveTemplate(String templateCode) {
        WhatsAppTemplate tpl = whatsAppTemplateRepository.findByTemplateCode(templateCode).orElse(null);
        if (tpl == null) return null;

        return TemplateResolutionResult.builder()
                .templateCode(tpl.getTemplateCode())
                .content(tpl.getMessage())
                .cssContent("")
                .subject("")
                .documentTemplates(tpl.getDocumentTemplates())
                .build();
    }
}
