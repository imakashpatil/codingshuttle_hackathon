package com.notifyhub.core.service.communication;

import com.notifyhub.core.entity.communication.CommunicationDefinition;
import com.notifyhub.core.entity.communication.CommunicationDefinitionChannel;
import com.notifyhub.core.entity.communication.CommunicationDefinitionPayload;
import com.notifyhub.core.entity.template.*;
import com.notifyhub.core.repository.template.EmailTemplateRepository;
import com.notifyhub.core.repository.template.PostalTemplateRepository;
import com.notifyhub.core.repository.template.SmsTemplateRepository;
import com.notifyhub.core.repository.template.WhatsAppTemplateRepository;
import com.notifyhub.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CommunicationPayloadGenerator {

    private final EmailTemplateRepository emailTemplateRepository;
    private final SmsTemplateRepository smsTemplateRepository;
    private final WhatsAppTemplateRepository whatsAppTemplateRepository;
    private final PostalTemplateRepository postalTemplateRepository;
    private final XmlPayloadConsolidator xmlPayloadConsolidator;

    public CommunicationDefinitionPayload generate(
            CommunicationDefinition definition) {

        List<String> payloads = new ArrayList<>();

        for (CommunicationDefinitionChannel channel :
                definition.getChannels()) {

            if (!Boolean.TRUE.equals(channel.getEnabled())) {
                continue;
            }

            if (channel.getTemplateId() == null) {
                throw new IllegalArgumentException(
                        "Template ID cannot be null for channel: " +
                                channel.getChannel()
                );
            }

            payloads.addAll(getPayloads(channel));
        }

        String consolidatedXml =
                xmlPayloadConsolidator.consolidate(payloads);

        return CommunicationDefinitionPayload.builder()
                .communicationDefinition(definition)
                .xmlSchema(consolidatedXml)
                .sampleXml(consolidatedXml)
                .version(definition.getVersion())
                .build();
    }

    private List<String> getPayloads(
            CommunicationDefinitionChannel channel) {

        return switch (channel.getChannel()) {
            case EMAIL -> getEmailPayloads(channel.getTemplateId());
            case SMS -> getSmsPayloads(channel.getTemplateId());
            case WHATSAPP ->
                    getWhatsAppPayloads(channel.getTemplateId());
            case POSTAL -> getPostalPayloads(channel.getTemplateId());
        };
    }

    private List<String> getEmailPayloads(UUID templateId) {

        EmailTemplate template =
                emailTemplateRepository.findById(templateId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Email template with id '" +
                                                templateId +
                                                "' not found"
                                )
                        );

        List<String> payloads = new ArrayList<>();

        addPayload(
                payloads,
                template.getXmlPayloadFormat()
        );

        addDocumentPayloads(
                payloads,
                template.getDocumentTemplates()
        );

        return payloads;
    }

    private List<String> getSmsPayloads(UUID templateId) {

        SmsTemplate template =
                smsTemplateRepository.findById(templateId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "SMS template with id '" +
                                                templateId +
                                                "' not found"
                                )
                        );

        List<String> payloads = new ArrayList<>();

        addPayload(
                payloads,
                template.getXmlPayloadFormat()
        );

        addDocumentPayloads(
                payloads,
                template.getDocumentTemplates()
        );

        return payloads;
    }

    private List<String> getWhatsAppPayloads(UUID templateId) {

        WhatsAppTemplate template =
                whatsAppTemplateRepository.findById(templateId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "WhatsApp template with id '" +
                                                templateId +
                                                "' not found"
                                )
                        );

        List<String> payloads = new ArrayList<>();

        addPayload(
                payloads,
                template.getXmlPayloadFormat()
        );

        addDocumentPayloads(
                payloads,
                template.getDocumentTemplates()
        );

        return payloads;
    }

    private List<String> getPostalPayloads(UUID templateId) {

        PostalTemplate template =
                postalTemplateRepository.findById(templateId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Postal template with id '" +
                                                templateId +
                                                "' not found"
                                )
                        );

        List<String> payloads = new ArrayList<>();

        /*
         * PostalTemplate has no XML payload of its own.
         * Only its document templates contribute
         * to the communication payload.
         */
        addDocumentPayloads(
                payloads,
                template.getDocumentTemplates()
        );

        return payloads;
    }

    private void addDocumentPayloads(
            List<String> payloads,
            List<DocumentTemplate> documents) {

        if (documents == null) {
            return;
        }

        documents.stream()
                .map(DocumentTemplate::getXmlPayloadFormat)
                .filter(Objects::nonNull)
                .filter(payload -> !payload.isBlank())
                .forEach(payloads::add);
    }

    private void addPayload(
            List<String> payloads,
            String payload) {

        if (payload != null && !payload.isBlank()) {
            payloads.add(payload);
        }
    }
}