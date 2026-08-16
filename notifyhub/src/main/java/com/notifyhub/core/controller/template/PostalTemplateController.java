package com.notifyhub.core.controller.template;

import com.notifyhub.core.dto.template.request.PostalTemplateRequest;
import com.notifyhub.core.dto.template.response.PostalTemplateResponse;
import com.notifyhub.core.service.template.PostalTemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/v1/templates/postal")
@RequiredArgsConstructor
public class PostalTemplateController {

    private final PostalTemplateService postalTemplateService;

    @PostMapping
    public ResponseEntity<PostalTemplateResponse> create(@Valid @RequestBody PostalTemplateRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED).body(postalTemplateService.create(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostalTemplateResponse> getById(@PathVariable UUID id) {

        return ResponseEntity.ok(postalTemplateService.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<PostalTemplateResponse>> getAll() {

        return ResponseEntity.ok(postalTemplateService.getAll());
    }

    @PutMapping("/{id}")
    public ResponseEntity<PostalTemplateResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody PostalTemplateRequest request) {

        return ResponseEntity.ok(postalTemplateService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {

        postalTemplateService.delete(id);

        return ResponseEntity.noContent().build();
    }
}
