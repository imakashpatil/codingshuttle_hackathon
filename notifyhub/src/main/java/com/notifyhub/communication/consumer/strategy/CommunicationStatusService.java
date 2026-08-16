package com.notifyhub.communication.consumer.strategy;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommunicationStatusService {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.kafka.topics.communication-status:communication.status}")
    private String statusTopic;

    public void publish(UUID communicationId, String status, String errorReason) {
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

            kafkaTemplate.send(statusTopic, communicationId.toString(), statusJson);

        } catch (Exception e) {
            log.error("Failed to push status update onto status topic", e);
        }
    }
}
