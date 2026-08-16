package com.notifyhub.communication.consumer.strategy;

import com.notifyhub.core.entity.template.PostalTemplate;
import com.notifyhub.core.enums.CommunicationChannel;
import com.notifyhub.core.repository.template.PostalTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class PostalTemplateCodeResolver implements TemplateCodeResolver {

    private final PostalTemplateRepository repository;

    @Override
    public String resolve(UUID templateId) {

        return repository.findById(templateId)
                .map(PostalTemplate::getTemplateCode)
                .orElse(null);
    }

    @Override
    public String supports() {
        return CommunicationChannel.POSTAL.name();
    }
}
