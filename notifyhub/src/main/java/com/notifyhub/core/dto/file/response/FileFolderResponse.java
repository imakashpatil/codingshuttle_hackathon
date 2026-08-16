package com.notifyhub.core.dto.file.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
public class FileFolderResponse {

    private UUID id;

    private String name;

    private String path;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private List<FileUploadResponse> files;
}
