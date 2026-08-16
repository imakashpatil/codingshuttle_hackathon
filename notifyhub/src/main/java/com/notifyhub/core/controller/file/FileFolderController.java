package com.notifyhub.core.controller.file;

import com.notifyhub.core.dto.file.request.FileFolderRequest;
import com.notifyhub.core.dto.file.response.FileFolderResponse;
import com.notifyhub.core.service.file.FileFolderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/v1/files/folders")
@RequiredArgsConstructor
public class FileFolderController {

    private final FileFolderService fileFolderService;

    @PostMapping
    public ResponseEntity<FileFolderResponse> create(@Valid @RequestBody FileFolderRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED).body(fileFolderService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<FileFolderResponse>> getAll() {
        return ResponseEntity.ok(fileFolderService.getAll());
    }


    @GetMapping("/{id}")
    public ResponseEntity<FileFolderResponse> getById(@PathVariable UUID id) {

        return ResponseEntity.ok(fileFolderService.getById(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {

        fileFolderService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
