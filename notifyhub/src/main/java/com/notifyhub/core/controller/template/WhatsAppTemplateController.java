package com.notifyhub.core.controller.template;

import com.notifyhub.core.dto.template.request.WhatsAppTemplateRequest;
import com.notifyhub.core.dto.template.response.WhatsAppTemplateResponse;
import com.notifyhub.core.service.template.WhatsAppTemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/v1/templates/whatsapp")
@RequiredArgsConstructor
public class WhatsAppTemplateController {

    private final WhatsAppTemplateService whatsAppTemplateService;

    @PostMapping
    public ResponseEntity<WhatsAppTemplateResponse> create(@Valid @RequestBody WhatsAppTemplateRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED).body(whatsAppTemplateService.create(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WhatsAppTemplateResponse> getById(@PathVariable UUID id) {

        return ResponseEntity.ok(whatsAppTemplateService.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<WhatsAppTemplateResponse>> getAll() {

        return ResponseEntity.ok(whatsAppTemplateService.getAll());
    }

    @PutMapping("/{id}")
    public ResponseEntity<WhatsAppTemplateResponse> update(@PathVariable UUID id, @Valid @RequestBody WhatsAppTemplateRequest request) {

        return ResponseEntity.ok(whatsAppTemplateService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {

        whatsAppTemplateService.delete(id);

        return ResponseEntity.noContent().build();
    }
}