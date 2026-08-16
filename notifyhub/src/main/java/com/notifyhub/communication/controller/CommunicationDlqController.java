package com.notifyhub.communication.controller;

import com.notifyhub.communication.entity.Communication;
import com.notifyhub.communication.service.dlq.CommunicationDlqService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/dlq")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class CommunicationDlqController {

    private final CommunicationDlqService communicationDlqService;

    @GetMapping
    public ResponseEntity<Page<Communication>> getDlqEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String channel
    ) {

        log.info(
                "Fetching paginated Dead Letter Queue communications. " + "Page: {}, Size: {}, Channel: {}",
                page, size, channel
        );

        return ResponseEntity.ok(
                communicationDlqService.getDlqEvents(page, size, channel)
        );
    }

    @GetMapping("/counts")
    public ResponseEntity<Map<String, Long>> getDlqCounts() {

        log.info("Fetching Dead Letter Queue counts by channel");

        return ResponseEntity.ok(
                communicationDlqService.getDlqCounts()
        );
    }

    @PostMapping("/{id}/retry")
    public ResponseEntity<Void> retryDlqEvent(
            @PathVariable UUID id) {

        log.info(
                "Request received to manually retry Dead Letter Queue communication ID: {}",
                id
        );

        communicationDlqService.retryDlqEvent(id);

        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/ignore")
    public ResponseEntity<Void> ignoreDlqEvent(
            @PathVariable UUID id) {

        log.info(
                "Request received to manually ignore DLQ communication ID: {}",
                id
        );

        communicationDlqService.ignoreDlqEvent(id);

        return ResponseEntity.ok().build();
    }
}