package com.notifyhub.communication.mocks;

import com.notifyhub.communication.entity.Communication;
import com.notifyhub.communication.repository.CommunicationRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.File;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class PostalMockScheduler {

    private final CommunicationRepository communicationRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;

    private static final String SPOOL_DIR = "../uploaded-files/postal_spool";
    private static final String STATUS_TOPIC = "communication.status";
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Scheduled(fixedDelay = 10000) // Poll spooled postal files every 10 seconds
    public void processSpooledPostalMails() {
        File dir = new File(SPOOL_DIR);
        if (!dir.exists() || !dir.isDirectory()) {
            return;
        }

        File[] files = dir.listFiles((d, name) -> name.endsWith("_spool.txt"));
        if (files == null || files.length == 0) {
            return;
        }

        for (File file : files) {
            try {
                log.info("[POSTAL MOCK SCHEDULE] Processing spooled postal manifest: {}", file.getName());
                
                String name = file.getName();
                String idStr = name.substring(0, name.indexOf("_spool.txt"));
                UUID commId = UUID.fromString(idStr);

                Communication comm = communicationRepository.findById(commId).orElse(null);
                if (comm != null && "DELIVERED".equals(comm.getStatus())) {
                    comm.setStatus("RECEIVED");
                    communicationRepository.save(comm);

                    publishStatusEvent(commId, "RECEIVED", null);
                    log.info("[POSTAL MOCK SCHEDULE] Communication ID {} successfully updated to RECEIVED status", commId);
                }

                File processedFile = new File(file.getAbsolutePath() + ".processed");
                if (file.renameTo(processedFile)) {
                    log.info("[POSTAL MOCK SCHEDULE] Renamed manifest file to: {}", processedFile.getName());
                } else {
                    log.warn("[POSTAL MOCK SCHEDULE] Failed to rename manifest file!");
                }
            } catch (Exception e) {
                log.error("[POSTAL MOCK SCHEDULE] Error processing spooled postal file: " + file.getName(), e);
            }
        }
    }

    private void publishStatusEvent(UUID commId, String status, String errorReason) {
        try {
            String statusJson = objectMapper.writeValueAsString(Map.of(
                    "communicationId", commId.toString(),
                    "status", status,
                    "errorReason", errorReason != null ? errorReason : "",
                    "timestamp", LocalDateTime.now().toString()
            ));
            kafkaTemplate.send(STATUS_TOPIC, commId.toString(), statusJson);
        } catch (Exception e) {
            log.error("Failed to push status update onto status topic", e);
        }
    }
}
