package com.notifyhub.core.service.communication;

import com.notifyhub.core.dto.communication.request.CommunicationDefinitionRequest;
import com.notifyhub.core.dto.communication.response.CommunicationDefinitionResponse;
import com.notifyhub.core.dto.template.response.DocumentTemplateResponse;
import com.notifyhub.core.entity.communication.CommunicationDefinition;
import com.notifyhub.core.entity.communication.CommunicationDefinitionChannel;
import com.notifyhub.core.entity.communication.CommunicationDefinitionPayload;
import com.notifyhub.core.entity.template.*;
import com.notifyhub.core.enums.CommunicationChannel;
import com.notifyhub.core.mapper.communication.CommunicationDefinitionMapper;
import com.notifyhub.core.repository.communication.CommunicationDefinitionRepository;
import com.notifyhub.core.repository.template.EmailTemplateRepository;
import com.notifyhub.core.repository.template.PostalTemplateRepository;
import com.notifyhub.core.repository.template.SmsTemplateRepository;
import com.notifyhub.core.repository.template.WhatsAppTemplateRepository;
import com.notifyhub.shared.exception.DuplicateResourceException;
import com.notifyhub.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class CommunicationDefinitionService {

    private final CommunicationDefinitionRepository communicationDefinitionRepository;
    private final EmailTemplateRepository emailTemplateRepository;
    private final SmsTemplateRepository smsTemplateRepository;
    private final WhatsAppTemplateRepository whatsAppTemplateRepository;
    private final PostalTemplateRepository postalTemplateRepository;
    private final CommunicationDefinitionMapper communicationDefinitionMapper;
    private final CommunicationPayloadGenerator communicationPayloadGenerator;

    public CommunicationDefinitionResponse create(
            CommunicationDefinitionRequest request) {

        validateCommunicationCode(
                request.getCommunicationCode()
        );

        CommunicationDefinition definition =
                communicationDefinitionMapper.toEntity(request);

        definition.setVersion(1);
        definition.setActive(true);

        definition.setChannels(
                buildChannels(request, definition)
        );

        CommunicationDefinitionPayload payload =
                communicationPayloadGenerator.generate(definition);

        definition.setPayload(payload);

        CommunicationDefinition saved =
                communicationDefinitionRepository.save(definition);

        return buildResponse(saved);
    }

    @Transactional(readOnly = true)
    public CommunicationDefinitionResponse getById(UUID id) {

        CommunicationDefinition definition =
                communicationDefinitionRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Communication definition with id '" +
                                                id +
                                                "' not found"
                                )
                        );

        return buildResponse(definition);
    }

    @Transactional(readOnly = true)
    public List<CommunicationDefinitionResponse> getAll() {

        return communicationDefinitionRepository.findAll()
                .stream()
                .map(this::buildResponse)
                .toList();
    }

    public CommunicationDefinitionResponse update(
            UUID id,
            CommunicationDefinitionRequest request) {

        CommunicationDefinition definition =
                communicationDefinitionRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Communication definition with id '" +
                                                id +
                                                "' not found"
                                )
                        );

        validateCommunicationCodeForUpdate(
                request.getCommunicationCode(),
                id
        );

        communicationDefinitionMapper.updateEntity(
                request,
                definition
        );

        definition.getChannels().clear();
        communicationDefinitionRepository.saveAndFlush(definition);

        definition.getChannels().addAll(
                buildChannels(request, definition)
        );

        definition.setVersion(
                definition.getVersion() + 1
        );

        CommunicationDefinitionPayload payload =
                communicationPayloadGenerator.generate(definition);

        definition.setPayload(payload);

        CommunicationDefinition updated =
                communicationDefinitionRepository.save(definition);

        return buildResponse(updated);
    }

    public void delete(UUID id) {

        CommunicationDefinition definition =
                communicationDefinitionRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Communication definition with id '" +
                                                id +
                                                "' not found"
                                )
                        );

        communicationDefinitionRepository.delete(definition);
    }

    private List<CommunicationDefinitionChannel> buildChannels(
            CommunicationDefinitionRequest request,
            CommunicationDefinition definition) {

        List<CommunicationDefinitionChannel> channels =
                new ArrayList<>();

        for (CommunicationDefinitionRequest.ChannelRequest channelRequest :
                request.getChannels()) {

            if (channelRequest.getTemplateId() == null) {
                throw new IllegalArgumentException(
                        "Template ID is required for channel: " +
                                channelRequest.getChannel()
                );
            }

            validateTemplate(
                    channelRequest.getChannel(),
                    channelRequest.getTemplateId()
            );

            CommunicationDefinitionChannel channel =
                    CommunicationDefinitionChannel.builder()
                            .communicationDefinition(definition)
                            .channel(channelRequest.getChannel())
                            .templateId(channelRequest.getTemplateId())
                            .enabled(channelRequest.getEnabled())
                            .priority(channelRequest.getPriority())
                            .build();

            channels.add(channel);
        }

        return channels;
    }

    private void validateTemplate(
            CommunicationChannel channel,
            UUID templateId) {

        switch (channel) {
            case EMAIL -> emailTemplateRepository.findById(templateId)
                    .orElseThrow(() ->
                            new ResourceNotFoundException(
                                    "Email template with id '" +
                                            templateId +
                                            "' not found"
                            )
                    );

            case SMS -> smsTemplateRepository.findById(templateId)
                    .orElseThrow(() ->
                            new ResourceNotFoundException(
                                    "SMS template with id '" +
                                            templateId +
                                            "' not found"
                            )
                    );

            case WHATSAPP -> whatsAppTemplateRepository.findById(templateId)
                    .orElseThrow(() ->
                            new ResourceNotFoundException(
                                    "WhatsApp template with id '" +
                                            templateId +
                                            "' not found"
                            )
                    );

            case POSTAL -> postalTemplateRepository.findById(templateId)
                    .orElseThrow(() ->
                            new ResourceNotFoundException(
                                    "Postal template with id '" +
                                            templateId +
                                            "' not found"
                            )
                    );
        }
    }

    private CommunicationDefinitionResponse buildResponse(
            CommunicationDefinition definition) {

        CommunicationDefinitionResponse.PayloadResponse payload =
                definition.getPayload() == null
                        ? null
                        : communicationDefinitionMapper
                        .toPayloadResponse(
                                definition.getPayload()
                        );

        List<CommunicationDefinitionResponse.ChannelResponse> channels =
                definition.getChannels()
                        .stream()
                        .map(this::buildChannelResponse)
                        .toList();

        return CommunicationDefinitionResponse.builder()
                .id(definition.getId())
                .communicationCode(
                        definition.getCommunicationCode()
                )
                .name(definition.getName())
                .description(definition.getDescription())
                .version(definition.getVersion())
                .active(definition.getActive())
                .channels(channels)
                .payload(payload)
                .createdAt(definition.getCreatedAt())
                .updatedAt(definition.getUpdatedAt())
                .build();
    }

    private CommunicationDefinitionResponse.ChannelResponse buildChannelResponse(
            CommunicationDefinitionChannel channel) {

        CommunicationDefinitionResponse.TemplateDetailResponse template =
                getTemplateDetails(
                        channel.getChannel(),
                        channel.getTemplateId()
                );

        return CommunicationDefinitionResponse.ChannelResponse.builder()
                .id(channel.getId())
                .channel(channel.getChannel())
                .templateId(channel.getTemplateId())
                .templateCode(template.getTemplateCode())
                .templateName(template.getTemplateName())
                .enabled(channel.getEnabled())
                .priority(channel.getPriority())
                .template(template)
                .build();
    }

    private CommunicationDefinitionResponse.TemplateDetailResponse getTemplateDetails(
            CommunicationChannel channel,
            UUID templateId) {

        return switch (channel) {
            case EMAIL -> buildEmailTemplateDetails(templateId);
            case SMS -> buildSmsTemplateDetails(templateId);
            case WHATSAPP -> buildWhatsAppTemplateDetails(templateId);
            case POSTAL -> buildPostalTemplateDetails(templateId);
        };
    }

    private CommunicationDefinitionResponse.TemplateDetailResponse buildEmailTemplateDetails(
            UUID templateId) {

        EmailTemplate template =
                emailTemplateRepository.findById(templateId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Email template with id '" +
                                                templateId +
                                                "' not found"
                                )
                        );

        return CommunicationDefinitionResponse.TemplateDetailResponse
                .builder()
                .id(template.getId())
                .templateCode(template.getTemplateCode())
                .templateName(template.getTemplateName())
                .templateType("EMAIL")
                .subject(template.getSubject())
                .htmlContent(template.getHtmlContent())
                .cssContent(template.getCssContent())
                .xmlPayloadFormat(template.getXmlPayloadFormat())
                .documentTemplates(
                        template.getDocumentTemplates()
                                .stream()
                                .map(this::toDocumentResponse)
                                .toList()
                )
                .build();
    }

    private CommunicationDefinitionResponse.TemplateDetailResponse buildSmsTemplateDetails(
            UUID templateId) {

        SmsTemplate template =
                smsTemplateRepository.findById(templateId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "SMS template with id '" +
                                                templateId +
                                                "' not found"
                                )
                        );

        return CommunicationDefinitionResponse.TemplateDetailResponse
                .builder()
                .id(template.getId())
                .templateCode(template.getTemplateCode())
                .templateName(template.getTemplateName())
                .templateType("SMS")
                .message(template.getMessage())
                .xmlPayloadFormat(template.getXmlPayloadFormat())
                .documentTemplates(
                        template.getDocumentTemplates()
                                .stream()
                                .map(this::toDocumentResponse)
                                .toList()
                )
                .build();
    }

    private CommunicationDefinitionResponse.TemplateDetailResponse buildWhatsAppTemplateDetails(
            UUID templateId) {

        WhatsAppTemplate template =
                whatsAppTemplateRepository.findById(templateId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "WhatsApp template with id '" +
                                                templateId +
                                                "' not found"
                                )
                        );

        return CommunicationDefinitionResponse.TemplateDetailResponse
                .builder()
                .id(template.getId())
                .templateCode(template.getTemplateCode())
                .templateName(template.getTemplateName())
                .templateType("WHATSAPP")
                .message(template.getMessage())
                .xmlPayloadFormat(template.getXmlPayloadFormat())
                .documentTemplates(
                        template.getDocumentTemplates()
                                .stream()
                                .map(this::toDocumentResponse)
                                .toList()
                )
                .build();
    }

    private CommunicationDefinitionResponse.TemplateDetailResponse buildPostalTemplateDetails(
            UUID templateId) {

        PostalTemplate template =
                postalTemplateRepository.findById(templateId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Postal template with id '" +
                                                templateId +
                                                "' not found"
                                )
                        );

        return CommunicationDefinitionResponse.TemplateDetailResponse
                .builder()
                .id(template.getId())
                .templateCode(template.getTemplateCode())
                .templateName(template.getTemplateName())
                .templateType("POSTAL")
                .documentTemplates(
                        template.getDocumentTemplates()
                                .stream()
                                .map(this::toDocumentResponse)
                                .toList()
                )
                .build();
    }

    private DocumentTemplateResponse toDocumentResponse(
            DocumentTemplate document) {

        return DocumentTemplateResponse.builder()
                .id(document.getId())
                .templateCode(document.getTemplateCode())
                .templateName(document.getTemplateName())
                .xmlPayloadFormat(document.getXmlPayloadFormat())
                .build();
    }

    private void validateCommunicationCode(
            String communicationCode) {

        if (communicationDefinitionRepository
                .existsByCommunicationCode(communicationCode)) {

            throw new DuplicateResourceException(
                    "Communication definition with code '" +
                            communicationCode +
                            "' already exists"
            );
        }
    }

    private void validateCommunicationCodeForUpdate(
            String communicationCode,
            UUID id) {

        if (communicationDefinitionRepository
                .existsByCommunicationCodeAndIdNot(
                        communicationCode,
                        id
                )) {

            throw new DuplicateResourceException(
                    "Communication definition with code '" +
                            communicationCode +
                            "' already exists"
            );
        }
    }
}