package com.notifyhub.communication.service.strategy;

import com.notifyhub.communication.dto.TemplateResolutionResult;
import com.notifyhub.core.entity.template.DocumentTemplate;
import com.notifyhub.core.entity.template.PostalTemplate;
import com.notifyhub.core.repository.template.PostalTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PostalTemplateResolutionStrategy implements TemplateResolutionStrategy {

    private final PostalTemplateRepository postalTemplateRepository;

    @Override
    public String getChannel() {
        return "POSTAL";
    }

    @Override
    public TemplateResolutionResult resolveTemplate(String templateCode) {
        PostalTemplate tpl = postalTemplateRepository.findByTemplateCode(templateCode).orElse(null);
        if (tpl == null) return null;

        String htmlContent = "";
        String cssContent = "";
        if (tpl.getDocumentTemplates() != null && !tpl.getDocumentTemplates().isEmpty()) {
            DocumentTemplate docTpl = tpl.getDocumentTemplates().get(0);
            htmlContent = docTpl.getHtmlContent();
            cssContent = docTpl.getCssContent();
        }

        return TemplateResolutionResult.builder()
                .templateCode(tpl.getTemplateCode())
                .content(htmlContent)
                .cssContent(cssContent)
                .subject("")
                .documentTemplates(tpl.getDocumentTemplates())
                .build();
    }
}
