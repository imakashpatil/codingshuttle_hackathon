package com.notifyhub.communication.consumer;

import com.notifyhub.communication.consumer.strategy.CommunicationStatusService;
import com.notifyhub.communication.delivery.DeliveryStrategy;
import com.notifyhub.communication.delivery.DeliveryStrategyFactory;
import com.notifyhub.communication.dto.ResolvedMessage;
import com.notifyhub.communication.entity.Communication;
import com.notifyhub.communication.entity.DeliveryAttempt;
import com.notifyhub.communication.repository.CommunicationRepository;
import com.notifyhub.communication.repository.DeliveryAttemptRepository;
import com.notifyhub.communication.service.TemplateResolverService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
@Service
@RequiredArgsConstructor
@Slf4j
public class DeliveryService {

    private final DeliveryStrategyFactory deliveryStrategyFactory;
    private final TemplateResolverService templateResolverService;
    private final CommunicationRepository communicationRepository;
    private final DeliveryAttemptRepository deliveryAttemptRepository;
    private final RetryService retryService;
    private final CommunicationStatusService communicationStatusService;

    public void deliver(Communication comm, ResolvedMessage resolved, String xmlData) {

        int attempt = comm.getRetryCount() + 1;

        try {
            DeliveryStrategy strategy = deliveryStrategyFactory.getStrategy(comm.getChannel());

            Map<String, Object> payload = templateResolverService.parseXmlToMap(xmlData);

            payload.put("communicationId", comm.getId().toString());
            payload.put("channel", comm.getChannel());
            payload.put("templateCode", comm.getTemplateCode());
            payload.put("renderedHtmlEmailBody", resolved.getHtmlContent());
            payload.put("hasRealAttachment", resolved.isRealAttachment());

            if (resolved.getSubject() != null) {
                payload.put("templateSubject", resolved.getSubject());
            }

            strategy.send(comm, payload);

            comm.setStatus("DELIVERED");
            comm.setErrorMessage(null);
            communicationRepository.save(comm);

            DeliveryAttempt delivery = DeliveryAttempt.builder()
                    .communicationId(comm.getId())
                    .attemptNumber(attempt)
                    .channel(comm.getChannel())
                    .status("DELIVERED")
                    .build();

            deliveryAttemptRepository.save(delivery);

            communicationStatusService.publish(comm.getId(), "DELIVERED", null);

            log.info("Outbound delivery finalized successfully for job ID: {}", comm.getId());

        } catch (Exception ex) {

            log.error("Outbound dispatch failed for attempt {}", attempt, ex);

            retryService.handleFailure(
                    comm,
                    attempt,
                    ex.getMessage()
            );
        }
    }
}