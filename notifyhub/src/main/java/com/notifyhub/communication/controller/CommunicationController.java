package com.notifyhub.communication.controller;

import com.notifyhub.communication.entity.Communication;
import com.notifyhub.communication.entity.DeliveryAttempt;

import com.notifyhub.communication.service.communication.CommunicationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/communications")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class CommunicationController {

    private final CommunicationService communicationService;

    @GetMapping("/{id}/pdf")
    public ResponseEntity<Resource> downloadPdf(@PathVariable UUID id) {

        log.info("Request received to download PDF for communication ID: {}", id);

        Resource resource = communicationService.getPdf(id);

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + resource.getFilename() + "\""
                )
                .contentType(MediaType.APPLICATION_PDF)
                .body(resource);
    }

    @GetMapping("/{id}/attempts")
    public ResponseEntity<List<DeliveryAttempt>> getAttempts(
            @PathVariable UUID id) {

        log.info("Request received to fetch delivery attempts for communication ID: {}", id);

        List<DeliveryAttempt> attempts = communicationService.getDeliveryAttempts(id);

        return ResponseEntity.ok(attempts);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Communication> updateCommunication(@PathVariable UUID id, @RequestBody Map<String, String> updates) {

        log.info("Request received to update communication ID: {}", id);

        Communication updated = communicationService.updateCommunication(id, updates);

        return ResponseEntity.ok(updated);
    }
}