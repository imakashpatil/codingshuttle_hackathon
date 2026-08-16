package com.notifyhub.communication.publisher;

import com.notifyhub.communication.entity.OutboxEvent;
import com.notifyhub.communication.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class OutboxPublisher {

    private final OutboxEventRepository outboxRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;

    @Value("${app.kafka.topics.communication-created:communication.created}")
    private String topic;

    @Scheduled(fixedDelay = 5000) // Poll database outbox every 5 seconds
    public void publishPendingEvents() {
        List<OutboxEvent> pendingEvents = outboxRepository.findByStatus("NEW");
        if (pendingEvents.isEmpty()) {
            return;
        }

        log.info("Found {} pending communications to publish onto broker", pendingEvents.size());

        for (OutboxEvent event : pendingEvents) {
            try {
                kafkaTemplate.send(topic, event.getAggregateId(), event.getPayload());
                
                event.setStatus("PUBLISHED");
                outboxRepository.save(event);
            } catch (Exception e) {
                log.error("Failed to publish outbox event to message broker, eventId: " + event.getId(), e);
            }
        }
    }
}
