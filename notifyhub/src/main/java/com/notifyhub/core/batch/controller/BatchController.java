package com.notifyhub.core.batch.controller;

import com.notifyhub.core.batch.dto.ImportRequest;
import com.notifyhub.core.batch.dto.ImportResponse;
import com.notifyhub.core.batch.service.ImportService;
import com.notifyhub.core.enums.ImportType;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/batch/import")
public class BatchController {

    private final ImportService importService;

    @PostMapping
    public ResponseEntity<ImportResponse> importData(
            @Valid @RequestBody ImportRequest request) throws Exception {

        ImportResponse response = importService.importData(request);

        return ResponseEntity
                .accepted()
                .body(response);
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getBatches(@RequestParam(value = "jobName", defaultValue = "customerImportJob") String jobName) {

        ImportType importType = "communicationImportJob".equals(jobName) ? ImportType.COMMUNICATION : ImportType.CUSTOMER;
        List<Map<String, Object>> response = importService.getImportExecutions(importType);
        return ResponseEntity.ok(response);
    }
}
