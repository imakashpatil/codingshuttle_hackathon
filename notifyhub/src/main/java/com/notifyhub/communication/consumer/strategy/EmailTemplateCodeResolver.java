package com.notifyhub.communication.consumer.strategy;

import com.notifyhub.core.entity.template.EmailTemplate;
import com.notifyhub.core.enums.CommunicationChannel;
import com.notifyhub.core.repository.template.EmailTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class EmailTemplateCodeResolver implements TemplateCodeResolver {

    private final EmailTemplateRepository repository;

    @Override
    public String resolve(UUID templateId) {

        return repository.findById(templateId)
                .map(EmailTemplate::getTemplateCode)
                .orElse(null);
    }

    @Override
    public String supports() {
        return CommunicationChannel.EMAIL.name();
    }
}