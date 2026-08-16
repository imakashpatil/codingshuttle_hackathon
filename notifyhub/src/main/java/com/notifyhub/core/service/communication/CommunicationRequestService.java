package com.notifyhub.core.service.communication;


import com.notifyhub.communication.entity.OutboxEvent;
import com.notifyhub.communication.repository.OutboxEventRepository;
import com.notifyhub.core.batch.communication.XmlValidator;
import com.notifyhub.core.dto.communication.request.CommunicationApiRequest;
import com.notifyhub.core.entity.communication.CommunicationDefinition;
import com.notifyhub.core.entity.communication.CommunicationRequest;
import com.notifyhub.core.entity.customer.Customer;
import com.notifyhub.core.repository.communication.CommunicationDefinitionRepository;
import com.notifyhub.core.repository.communication.CommunicationRequestRepository;
import com.notifyhub.core.repository.customer.CustomerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommunicationRequestService {

    private final CommunicationRequestRepository communicationRequestRepository;
    private final CommunicationDefinitionRepository communicationDefinitionRepository;
    private final CustomerRepository customerRepository;
    private final OutboxEventRepository outboxEventRepository;

    @Transactional
    public CommunicationRequest createCommunicationRequest(
            CommunicationApiRequest request) {

        log.info(
                "Creating communication request for customerId={}",
                request.getCustomerId()
        );


        if (request.getCustomerId() == null ||
                request.getCustomerId().isBlank()) {

            throw new IllegalArgumentException(
                    "Customer ID is required"
            );
        }

        if (request.getCommunicationData() == null ||
                request.getCommunicationData().isBlank()) {

            throw new IllegalArgumentException(
                    "Communication data is required"
            );
        }


        String definitionCode =
                extractCommunicationDefinitionCode(
                        request.getCommunicationData()
                );

        log.info(
                "Communication definition code extracted: {}",
                definitionCode
        );

        Customer customer =
                customerRepository
                        .findByCustomerCode(
                                request.getCustomerId()
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Customer not found for code: "
                                                + request.getCustomerId()
                                )
                        );

        CommunicationDefinition definition =
                communicationDefinitionRepository
                        .findByCommunicationCode(
                                definitionCode
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Communication definition not found: "
                                                + definitionCode
                                )
                        );

        validateCommunicationXml(
                definition,
                request.getCommunicationData()
        );


        CommunicationRequest communicationRequest =
                CommunicationRequest.builder()
                        .customerId(customer.getId())
                        .communicationDefinitionCode(definitionCode)
                        .xmlData(request.getCommunicationData())
                        .status("PENDING")
                        .build();

        CommunicationRequest savedRequest =
                communicationRequestRepository.save(
                        communicationRequest
                );

        OutboxEvent outboxEvent =
                OutboxEvent.builder()
                        .aggregateType("CommunicationRequest")
                        .aggregateId(
                                savedRequest.getId().toString()
                        )
                        .eventType("communication.created")
                        .payload(savedRequest.getXmlData())
                        .status("NEW")
                        .build();

        outboxEventRepository.save(outboxEvent);

        log.info(
                "CommunicationRequest created successfully. " +
                        "requestId={}, definitionCode={}",
                savedRequest.getId(),
                definitionCode
        );

        return savedRequest;
    }

    private String extractCommunicationDefinitionCode(
            String communicationData) {

        String startTag =
                "<communicationDefinitionCode>";

        String endTag =
                "</communicationDefinitionCode>";

        int startIndex =
                communicationData.indexOf(startTag);

        if (startIndex == -1) {
            throw new IllegalArgumentException(
                    "communicationDefinitionCode not found in communicationData"
            );
        }

        int endIndex =
                communicationData.indexOf(
                        endTag,
                        startIndex + startTag.length()
                );

        if (endIndex == -1) {
            throw new IllegalArgumentException(
                    "Invalid communicationData: " +
                            "communicationDefinitionCode closing tag not found"
            );
        }

        String code =
                communicationData.substring(
                        startIndex + startTag.length(),
                        endIndex
                ).trim();

        if (code.isBlank()) {
            throw new IllegalArgumentException(
                    "communicationDefinitionCode cannot be empty"
            );
        }

        return code;
    }

    private void validateCommunicationXml(
            CommunicationDefinition definition,
            String communicationData) {

        if (definition.getPayload() == null) {
            log.debug(
                    "No payload configured for communication definition {}. " +
                            "Skipping XML validation.",
                    definition.getCommunicationCode()
            );
            return;
        }

        String sampleXml =
                definition.getPayload().getSampleXml();

        if (sampleXml == null || sampleXml.isBlank()) {
            log.debug(
                    "No sample XML configured for communication definition {}. " +
                            "Skipping XML validation.",
                    definition.getCommunicationCode()
            );
            return;
        }

        List<XmlValidator.XmlValidationError> errors =
                XmlValidator.validateXml(
                        sampleXml,
                        communicationData
                );

        if (errors == null || errors.isEmpty()) {
            return;
        }

        String errorMessage =
                errors.stream()
                        .map(error ->
                                (error.path() == null ||
                                        error.path().isEmpty()
                                        ? ""
                                        : error.path() + ": ")
                                        + error.message()
                        )
                        .collect(Collectors.joining("; "));

        throw new IllegalArgumentException(
                "XML validation failed: " + errorMessage
        );
    }
}
