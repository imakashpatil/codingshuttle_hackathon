package com.notifyhub.communication.service.dlq;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.notifyhub.communication.entity.Communication;
import com.notifyhub.communication.dto.DlqCountProjection;
import com.notifyhub.communication.repository.CommunicationRepository;
import com.notifyhub.core.entity.communication.CommunicationRequest;
import com.notifyhub.core.repository.communication.CommunicationRequestRepository;
import com.notifyhub.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommunicationDlqService {

    private static final String DEAD_LETTER = "DEAD_LETTER";
    private static final String RETRYING = "RETRYING";
    private static final String IGNORED = "IGNORED";

    private final CommunicationRepository communicationRepository;
    private final CommunicationRequestRepository communicationRequestRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.kafka.topics.communication-created:communication.created}")
    private String createdTopic;

    @Value("${app.kafka.topics.communication-status:communication.status}")
    private String statusTopic;

    public Page<Communication> getDlqEvents(int page, int size, String channel) {

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by("createdAt").descending()
        );

        if (isValidChannel(channel)) {
            return communicationRepository.findByStatusAndChannel(
                    DEAD_LETTER,
                    channel.toUpperCase(),
                    pageable
            );
        }

        return communicationRepository.findByStatus(
                DEAD_LETTER,
                pageable
        );
    }

    public Map<String, Long> getDlqCounts() {

        DlqCountProjection result = communicationRepository.getDlqCounts();

        Map<String, Long> counts = new HashMap<>();

        counts.put("ALL", result.getAllCount());
        counts.put("EMAIL", result.getEmailCount());
        counts.put("WHATSAPP", result.getWhatsappCount());
        counts.put("SMS", result.getSmsCount());
        counts.put("POSTAL", result.getPostalCount());

        return counts;
    }
    public void retryDlqEvent(UUID id) {

        Communication communication = communicationRepository
                .findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Communication ID not found: " + id
                        )
                );

        CommunicationRequest request = communicationRequestRepository
                .findById(communication.getRequestId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Parent CommunicationRequest not found for request ID: "
                                        + communication.getRequestId()
                        )
                );

        communication.setRetryCount(0);
        communication.setStatus(RETRYING);
        communication.setErrorMessage(null);

        communicationRepository.save(communication);

        publishStatusEvent(
                id,
                RETRYING,
                null
        );

        try {
            kafkaTemplate.send(
                    createdTopic,
                    communication.getRequestId().toString(),
                    request.getXmlData()
            );

            log.info(
                    "Successfully republished communication request onto Kafka queue " +
                            "for request ID: {}",
                    communication.getRequestId()
            );

        } catch (Exception e) {
            log.error(
                    "Failed to republish communication request to Kafka, id: {}",
                    id,
                    e
            );
            throw new RuntimeException(
                    "Failed to republish communication request: " + id,
                    e
            );
        }
    }

    public void ignoreDlqEvent(UUID id) {

        Communication communication = communicationRepository
                .findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Communication ID not found: " + id
                        )
                );

        communication.setStatus(IGNORED);

        communicationRepository.save(communication);

        publishStatusEvent(
                id,
                IGNORED,
                null
        );
    }

    private void publishStatusEvent(
            UUID communicationId,
            String status,
            String errorReason) {

        try {

            String statusJson = objectMapper.writeValueAsString(
                    Map.of(
                            "communicationId", communicationId.toString(),
                            "status", status,
                            "errorReason",
                            errorReason != null ? errorReason : "",
                            "timestamp",
                            LocalDateTime.now().toString()
                    )
            );

            kafkaTemplate.send(
                    statusTopic,
                    communicationId.toString(),
                    statusJson
            );

        } catch (Exception e) {

            log.error(
                    "Failed to push status update onto status topic",
                    e
            );
        }
    }

    private boolean isValidChannel(String channel) {

        return channel != null
                && !channel.trim().isEmpty()
                && !"ALL".equalsIgnoreCase(channel);
    }
}