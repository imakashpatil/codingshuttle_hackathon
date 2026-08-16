package com.notifyhub.core.controller.template;

import com.notifyhub.core.dto.template.request.EmailTemplateRequest;
import com.notifyhub.core.dto.template.response.EmailTemplateResponse;
import com.notifyhub.core.service.template.EmailTemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/v1/templates/email")
@RequiredArgsConstructor
public class EmailTemplateController {

    private final EmailTemplateService emailTemplateService;

    @PostMapping
    public ResponseEntity<EmailTemplateResponse> create(@Valid @RequestBody EmailTemplateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(emailTemplateService.create(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmailTemplateResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(emailTemplateService.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<EmailTemplateResponse>> getAll() {
        return ResponseEntity.ok(emailTemplateService.getAll());
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmailTemplateResponse> update(@PathVariable UUID id, @Valid @RequestBody EmailTemplateRequest request) {

        return ResponseEntity.ok(emailTemplateService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {

        emailTemplateService.delete(id);

        return ResponseEntity.noContent().build();
    }
}