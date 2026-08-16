package com.notifyhub.core.controller.template;

import com.notifyhub.core.dto.template.request.SmsTemplateRequest;
import com.notifyhub.core.dto.template.response.SmsTemplateResponse;
import com.notifyhub.core.service.template.SmsTemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/v1/templates/sms")
@RequiredArgsConstructor
public class SmsTemplateController {

    private final SmsTemplateService smsTemplateService;

    @PostMapping
    public ResponseEntity<SmsTemplateResponse> create(@Valid @RequestBody SmsTemplateRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(smsTemplateService.create(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SmsTemplateResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(smsTemplateService.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<SmsTemplateResponse>> getAll() {
        return ResponseEntity.ok(smsTemplateService.getAll());
    }

    @PutMapping("/{id}")
    public ResponseEntity<SmsTemplateResponse> update(@PathVariable UUID id, @Valid @RequestBody SmsTemplateRequest request) {
        return ResponseEntity.ok(smsTemplateService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        smsTemplateService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
