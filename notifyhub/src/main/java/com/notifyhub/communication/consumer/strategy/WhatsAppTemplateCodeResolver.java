package com.notifyhub.communication.consumer.strategy;

import com.notifyhub.core.entity.template.WhatsAppTemplate;
import com.notifyhub.core.enums.CommunicationChannel;
import com.notifyhub.core.repository.template.WhatsAppTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class WhatsAppTemplateCodeResolver implements TemplateCodeResolver {

    private final WhatsAppTemplateRepository repository;

    @Override
    public String resolve(UUID templateId) {

        return repository.findById(templateId)
                .map(WhatsAppTemplate::getTemplateCode)
                .orElse(null);
    }

    @Override
    public String supports() {
        return CommunicationChannel.WHATSAPP.name();
    }
}
