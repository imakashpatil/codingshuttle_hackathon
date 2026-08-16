package com.notifyhub.communication.consumer;

import com.notifyhub.communication.consumer.strategy.CommunicationStatusService;
import com.notifyhub.communication.entity.Communication;
import com.notifyhub.communication.entity.DeliveryAttempt;
import com.notifyhub.communication.repository.CommunicationRepository;
import com.notifyhub.communication.repository.DeliveryAttemptRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
@Service
@RequiredArgsConstructor
@Slf4j
public class RetryService {

    private static final int MAX_RETRIES = 3;

    private final CommunicationRepository communicationRepository;
    private final DeliveryAttemptRepository deliveryAttemptRepository;
    private final CommunicationStatusService statusService;

    public void handleFailure(Communication comm, int attempt, String errorMessage) {

        DeliveryAttempt delivery = deliveryAttemptRepository
                .findByCommunicationId(comm.getId())
                .orElseGet(() -> DeliveryAttempt.builder()
                        .communicationId(comm.getId())
                        .channel(comm.getChannel())
                        .build());

        delivery.setAttemptNumber(attempt);
        delivery.setStatus("FAILED");
        delivery.setErrorMessage(errorMessage);

        deliveryAttemptRepository.save(delivery);

        comm.setErrorMessage(errorMessage);
        comm.setRetryCount(attempt);

        if (attempt >= MAX_RETRIES) {

            comm.setStatus("DEAD_LETTER");
            communicationRepository.save(comm);

            statusService.publish(comm.getId(), "DEAD_LETTER", errorMessage);

            log.error("Communication {} moved to DEAD_LETTER after {} attempts",
                    comm.getId(), attempt);

        } else {

            comm.setStatus("RETRYING");
            communicationRepository.save(comm);

            statusService.publish(comm.getId(), "RETRYING", errorMessage);

            log.warn("Communication {} scheduled for retry. Attempt: {}",
                    comm.getId(), attempt);
        }
    }
}