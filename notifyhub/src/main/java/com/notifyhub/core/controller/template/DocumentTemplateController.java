package com.notifyhub.core.controller.template;

import com.notifyhub.core.dto.template.request.DocumentTemplateRequest;
import com.notifyhub.core.dto.template.response.DocumentTemplateResponse;
import com.notifyhub.core.service.template.DocumentTemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/v1/templates/documents")
@RequiredArgsConstructor
public class DocumentTemplateController {

    private final DocumentTemplateService documentTemplateService;

    @PostMapping
    public ResponseEntity<DocumentTemplateResponse> create(@Valid @RequestBody DocumentTemplateRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(documentTemplateService.create(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DocumentTemplateResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(
                documentTemplateService.getById(id)
        );
    }

    @GetMapping
    public ResponseEntity<List<DocumentTemplateResponse>> getAll() {
        return ResponseEntity.ok(
                documentTemplateService.getAll()
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<DocumentTemplateResponse> update(@PathVariable UUID id, @Valid @RequestBody DocumentTemplateRequest request) {
        return ResponseEntity.ok(documentTemplateService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        documentTemplateService.delete(id);
        return ResponseEntity.noContent().build();
    }
}