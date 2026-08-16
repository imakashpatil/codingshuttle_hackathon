package com.notifyhub.core.batch.communication;

import com.notifyhub.core.batch.dto.CommunicationImportRecord;
import com.notifyhub.core.entity.communication.CommunicationDefinition;
import com.notifyhub.core.entity.communication.CommunicationRequest;
import com.notifyhub.core.entity.customer.Customer;
import com.notifyhub.core.repository.communication.CommunicationDefinitionRepository;
import com.notifyhub.core.repository.customer.CustomerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.infrastructure.item.ItemProcessor;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RequiredArgsConstructor
public class CommunicationItemProcessor implements ItemProcessor<CommunicationImportRecord, CommunicationRequest> {

    private final CommunicationDefinitionRepository communicationDefinitionRepository;
    private final CustomerRepository customerRepository;

    @Override
    public CommunicationRequest process(CommunicationImportRecord item) {
        log.info("Processing communication record: customerId={}, definitionCode={}", 
                item.getCustomerId(), item.getCommunicationDefinitionCode()
        );
        
        validate(item);

        Customer customer = customerRepository
                .findByCustomerCode(item.getCustomerId())
                .orElseThrow(() -> new IllegalArgumentException("Customer not found for code: " + item.getCustomerId()));

        CommunicationDefinition definition = communicationDefinitionRepository
                .findByCommunicationCode(item.getCommunicationDefinitionCode())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Communication definition not found: " + item.getCommunicationDefinitionCode()
                ));

        if (definition.getPayload() != null && definition.getPayload().getSampleXml() != null) {
            String sampleXml = definition.getPayload().getSampleXml();

            // validate provided xml if file is valid against the generated xml using communication Definition service
            List<XmlValidator.XmlValidationError> errors = XmlValidator.validateXml(sampleXml, item.getCommunicationData());

            if (errors != null && !errors.isEmpty()) {
                String errorMsg = errors.stream()
                        .map(e -> (e.path().isEmpty() ? "" : e.path() + ": ") + e.message())
                        .collect(Collectors.joining("; "));
                throw new IllegalArgumentException("XML validation failed: " + errorMsg);
            }
        }

        return CommunicationRequest.builder()
                .customerId(customer.getId())
                .communicationDefinitionCode(item.getCommunicationDefinitionCode())
                .xmlData(item.getCommunicationData())
                .status("PENDING")
                .build();
    }

    private void validate(CommunicationImportRecord item) {
        if (isBlank(item.getCustomerId())) {
            throw new IllegalArgumentException("Customer ID is required");
        }
        if (isBlank(item.getCommunicationDefinitionCode())) {
            throw new IllegalArgumentException("Communication definition code is required");
        }
        if (isBlank(item.getCommunicationData())) {
            throw new IllegalArgumentException("Communication data XML is required");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
