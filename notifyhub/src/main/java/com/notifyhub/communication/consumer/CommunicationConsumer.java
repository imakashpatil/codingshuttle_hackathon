package com.notifyhub.communication.consumer;

import com.notifyhub.communication.consumer.strategy.CommunicationStatusService;
import com.notifyhub.communication.dto.ResolvedMessage;
import com.notifyhub.communication.entity.Communication;
import com.notifyhub.communication.repository.CommunicationRepository;
import com.notifyhub.communication.service.TemplateResolverService;
import com.notifyhub.communication.service.cache.CommunicationDefinitionCacheService;
import com.notifyhub.core.entity.communication.CommunicationDefinition;
import com.notifyhub.core.entity.communication.CommunicationDefinitionChannel;
import com.notifyhub.core.entity.communication.CommunicationRequest;
import com.notifyhub.core.entity.customer.Customer;
import com.notifyhub.core.repository.communication.CommunicationDefinitionRepository;
import com.notifyhub.core.repository.communication.CommunicationRequestRepository;
import com.notifyhub.core.repository.customer.CustomerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class CommunicationConsumer{

    private final CommunicationRequestRepository communicationRequestRepository;
    private final CommunicationDefinitionRepository communicationDefinitionRepository;
    private final CustomerRepository customerRepository;
    private final CommunicationRepository communicationRepository;

    private final TemplateCodeService templateCodeService;
    private final TemplateResolverService templateResolverService;
    private final DeliveryService deliveryService;
    private final RetryService retryService;
    private final CommunicationStatusService communicationStatusService;
    private final CommunicationDefinitionCacheService communicationDefinitionCacheService;

    private final KafkaTemplate<String, String> kafkaTemplate;

    @Value("${app.kafka.topics.communication-created:communication.created}")
    private String createdTopic;

    @KafkaListener(
            topics = "${app.kafka.topics.communication-created}",
            groupId = "communication-group"
    )
    @Transactional
    public void consumeCommunicationEvent(@Payload String xmlData, @Header(KafkaHeaders.RECEIVED_KEY) String key) throws Exception {

        log.info("Received Kafka dispatch request event for parent request ID: {}", key);

        UUID requestId;
        try {
            requestId = UUID.fromString(key);
        } catch (Exception ex) {
            log.error("Invalid request ID format in event key: {}", key);
            return;
        }

        CommunicationRequest request = communicationRequestRepository.findById(requestId).orElse(null);

        if (request == null) {
            log.warn("CommunicationRequest with ID {} not found in database.", requestId);
            return;
        }

        Customer customer = customerRepository.findById(request.getCustomerId()).orElse(null);

        if (customer == null) {
            log.error("Customer metadata missing for request ID: {}", requestId);
            return;
        }

        // cache check
        CommunicationDefinition definition = communicationDefinitionCacheService.get(
                request.getCommunicationDefinitionCode()
        );

        if (definition == null) {
            definition = communicationDefinitionRepository
                    .findByCommunicationCode(request.getCommunicationDefinitionCode())
                    .orElse(null);

            if (definition != null) {
                communicationDefinitionCacheService.put(
                        request.getCommunicationDefinitionCode(),
                        definition
                );
            }
        }

        if (definition == null || definition.getChannels() == null) {
            log.warn("No definition config channels found for code: {}", request.getCommunicationDefinitionCode());
            return;
        }

        for (CommunicationDefinitionChannel definitionChannel : definition.getChannels()) {

            if (!Boolean.TRUE.equals(definitionChannel.getEnabled())) {
                continue;
            }

            String channelName = definitionChannel.getChannel().name();

            boolean isPreferred = false;

            if (customer.getPreferredChannels() != null) {
                for (com.notifyhub.core.enums.CommunicationChannel preferred : customer.getPreferredChannels()) {
                    if (preferred.name().equalsIgnoreCase(channelName)) {
                        isPreferred = true;
                        break;
                    }
                }
            }

            if (!isPreferred) {
                log.info("Skipping delivery channel {} because it is not preferred/opted-in by customer: {}",
                        channelName, customer.getCustomerCode()
                );
                continue;
            }

            UUID templateId = definitionChannel.getTemplateId();

            String templateCode = templateCodeService.getTemplateCode(templateId, definitionChannel.getChannel().name());

            Communication comm = communicationRepository
                    .findByRequestIdAndChannel(requestId, channelName)
                    .orElse(null);

            if (comm == null) {

                String address = (customer.getAddressLine1() != null ? customer.getAddressLine1() : "")
                        + (customer.getAddressLine2() != null ? ", " + customer.getAddressLine2() : "")
                        + (customer.getCity() != null ? ", " + customer.getCity() : "")
                        + (customer.getPostalCode() != null ? ", " + customer.getPostalCode() : "");

                comm = Communication.builder()
                        .id(UUID.randomUUID())
                        .requestId(requestId)
                        .customerName(customer.getName() != null ? customer.getName() : "Client")
                        .email(customer.getEmail() != null ? customer.getEmail() : "")
                        .mobileNumber(customer.getMobileNumber() != null ? customer.getMobileNumber() : "")
                        .postalAddress(address)
                        .templateCode(templateCode)
                        .status("WAITING_FOR_PDF")
                        .channel(channelName)
                        .retryCount(0)
                        .build();

                communicationRepository.save(comm);

            } else {
                if (!"RETRYING".equals(comm.getStatus()) && !"WAITING_FOR_PDF".equals(comm.getStatus())) {
                    continue;
                }

                comm.setStatus("WAITING_FOR_PDF");
                comm.setErrorMessage(null);
                communicationRepository.save(comm);
            }

            communicationStatusService.publish(comm.getId(), "PROCESSING", null);

            ResolvedMessage resolved;

            try {

                resolved = templateResolverService.resolveAndCompile(
                        comm.getId(),
                        requestId,
                        channelName,
                        templateCode,
                        xmlData
                );

                if (resolved.getPdfPath() != null) {
                    comm.setPdfPath(resolved.getPdfPath());
                }

                comm.setRenderedBody(resolved.getHtmlContent());
                comm.setStatus("PDF_GENERATED");

                communicationRepository.save(comm);

                communicationStatusService.publish(comm.getId(), "PDF_GENERATED", null);

            } catch (Exception e) {
                log.error("Template compiling failed for dispatch: " + comm.getId(), e);
                retryService.handleFailure(
                        comm,
                        comm.getRetryCount() + 1,
                        "Template Error: " + e.getMessage()
                );
                continue;
            }

            deliveryService.deliver(comm, resolved, xmlData);
        }

        List<Communication> dispatches = communicationRepository.findByRequestId(requestId);

        boolean allDelivered = true;
        boolean anyRetrying = false;
        boolean anyDeadLetter = false;

        for (Communication d : dispatches) {

            if ("RETRYING".equals(d.getStatus()) || "WAITING_FOR_PDF".equals(d.getStatus())) {
                anyRetrying = true;
            } else if ("DEAD_LETTER".equals(d.getStatus())) {
                anyDeadLetter = true;
                allDelivered = false;
            } else if (!"DELIVERED".equals(d.getStatus()) && !"SENT".equals(d.getStatus())) {
                allDelivered = false;
            }
        }

        if (anyRetrying) {

            request.setStatus("PROCESSING");

            new Thread(() -> {
                try {
                    Thread.sleep(5000);
                    kafkaTemplate.send(createdTopic, requestId.toString(), xmlData);
                } catch (Exception e) {
                    log.error("Re-queue process failed", e);
                }
            }).start();

        } else if (anyDeadLetter) {
            request.setStatus("FAILED");
        } else if (allDelivered) {
            request.setStatus("DELIVERED");
        } else {
            request.setStatus("FAILED");
        }

        communicationRequestRepository.save(request);
    }
}
