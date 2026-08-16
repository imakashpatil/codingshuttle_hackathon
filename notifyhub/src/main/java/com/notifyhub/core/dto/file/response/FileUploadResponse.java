package com.notifyhub.core.dto.file.response;

import com.notifyhub.core.enums.FileStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
public class FileUploadResponse {

    private UUID id;

    private UUID folderId;

    private String fileName;

    private String contentType;

    private Long fileSize;

    private String checksum;

    private FileStatus status;

    private String storagePath;

    private LocalDateTime createdAt;
}
