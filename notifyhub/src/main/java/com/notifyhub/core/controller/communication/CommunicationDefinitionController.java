package com.notifyhub.core.controller.communication;

import com.notifyhub.core.dto.communication.request.CommunicationDefinitionRequest;
import com.notifyhub.core.dto.communication.response.CommunicationDefinitionResponse;
import com.notifyhub.core.service.communication.CommunicationDefinitionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/v1/communication-definitions")
@RequiredArgsConstructor
public class CommunicationDefinitionController {

    private final CommunicationDefinitionService communicationDefinitionService;

    @PostMapping
    public ResponseEntity<CommunicationDefinitionResponse> create(@Valid @RequestBody CommunicationDefinitionRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(communicationDefinitionService.create(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CommunicationDefinitionResponse> getById(@PathVariable UUID id) {

        return ResponseEntity.ok(communicationDefinitionService.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<CommunicationDefinitionResponse>> getAll() {

        return ResponseEntity.ok(communicationDefinitionService.getAll());
    }

    @PutMapping("/{id}")
    public ResponseEntity<CommunicationDefinitionResponse> update(@PathVariable UUID id, @Valid @RequestBody CommunicationDefinitionRequest request) {

        return ResponseEntity.ok(communicationDefinitionService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {

        communicationDefinitionService.delete(id);

        return ResponseEntity.noContent().build();
    }
}