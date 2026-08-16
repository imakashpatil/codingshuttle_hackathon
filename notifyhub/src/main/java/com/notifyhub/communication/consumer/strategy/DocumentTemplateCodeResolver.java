package com.notifyhub.communication.consumer.strategy;

import com.notifyhub.core.entity.template.DocumentTemplate;
import com.notifyhub.core.enums.CommunicationChannel;
import com.notifyhub.core.repository.template.DocumentTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class DocumentTemplateCodeResolver implements TemplateCodeResolver {

    private final DocumentTemplateRepository repository;

    @Override
    public String resolve(UUID templateId) {

        return repository.findById(templateId)
                .map(DocumentTemplate::getTemplateCode)
                .orElse("null");
    }

    @Override
    public String supports() {
        return "DOCUMENT";
    }
}
