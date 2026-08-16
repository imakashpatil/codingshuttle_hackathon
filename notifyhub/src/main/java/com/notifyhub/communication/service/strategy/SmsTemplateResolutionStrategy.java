package com.notifyhub.communication.service.strategy;

import com.notifyhub.communication.dto.TemplateResolutionResult;
import com.notifyhub.core.entity.template.SmsTemplate;
import com.notifyhub.core.repository.template.SmsTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SmsTemplateResolutionStrategy implements TemplateResolutionStrategy {

    private final SmsTemplateRepository smsTemplateRepository;

    @Override
    public String getChannel() {
        return "SMS";
    }

    @Override
    public TemplateResolutionResult resolveTemplate(String templateCode) {
        SmsTemplate tpl = smsTemplateRepository.findByTemplateCode(templateCode).orElse(null);
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
