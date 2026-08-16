package com.notifyhub.core.dto.file.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class FileUploadInitRequest {

    @NotNull
    private UUID folderId;

    @NotBlank
    private String fileName;

    @NotNull
    private Long fileSize;

    @NotNull
    private Integer totalChunks;
}