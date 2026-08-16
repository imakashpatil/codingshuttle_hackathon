package com.notifyhub.core.controller.file;

import com.notifyhub.core.dto.file.request.FileUploadInitRequest;
import com.notifyhub.core.dto.file.response.FileUploadInitResponse;
import com.notifyhub.core.dto.file.response.FileUploadResponse;
import com.notifyhub.core.service.file.FileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<FileUploadResponse> upload(@RequestParam UUID folderId, @RequestParam MultipartFile file) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(fileService.upload(folderId, file));
    }

    @PostMapping("/upload/init")
    public ResponseEntity<FileUploadInitResponse> initializeUpload(@Valid @RequestBody FileUploadInitRequest request) {

        return ResponseEntity.ok(fileService.initializeUpload(request));
    }


    @PostMapping(value = "/upload/{uploadId}/chunk", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> uploadChunk(@PathVariable UUID uploadId, @RequestParam Integer chunkNumber, @RequestParam MultipartFile chunk) {

        fileService.uploadChunk(uploadId, chunkNumber, chunk);

        return ResponseEntity.ok().build();
    }

    @PostMapping("/upload/{uploadId}/complete")
    public ResponseEntity<FileUploadResponse> completeUpload(@PathVariable UUID uploadId) {

        return ResponseEntity.ok(fileService.completeUpload(uploadId));
    }
}