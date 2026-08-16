package com.notifyhub.core.batch.communication;

import com.notifyhub.communication.entity.OutboxEvent;
import com.notifyhub.communication.repository.OutboxEventRepository;
import com.notifyhub.core.entity.communication.CommunicationRequest;
import com.notifyhub.core.repository.communication.CommunicationRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.infrastructure.item.Chunk;
import org.springframework.batch.infrastructure.item.ItemWriter;

@Slf4j
@RequiredArgsConstructor
public class CommunicationItemWriter implements ItemWriter<CommunicationRequest> {

    private final CommunicationRequestRepository communicationRequestRepository;
    private final OutboxEventRepository outboxRepository;

    @Override
    public void write(Chunk<? extends CommunicationRequest> chunk) {
        log.info("Batch Communication writer writing chunk of size: {}", chunk.size());
        
        for (CommunicationRequest request : chunk.getItems()) {

            // save the Request in DB and then later create outbox event
            CommunicationRequest savedReq = communicationRequestRepository.save(request);

            // Create exactly one OutboxEvent for the CommunicationRequest
            OutboxEvent outbox = OutboxEvent.builder()
                    .aggregateType("CommunicationRequest")
                    .aggregateId(savedReq.getId().toString())
                    .eventType("communication.created")
                    .payload(savedReq.getXmlData()) // Store raw XML data directly
                    .status("NEW")
                    .build();

            outboxRepository.save(outbox);
            log.info("Spooled outbox event for CommunicationRequest ID: {}", savedReq.getId());
        }
    }
}
