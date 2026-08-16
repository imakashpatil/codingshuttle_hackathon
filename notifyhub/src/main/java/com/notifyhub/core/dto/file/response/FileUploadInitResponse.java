package com.notifyhub.core.dto.file.response;


import com.notifyhub.core.enums.UploadStatus;
import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
public class FileUploadInitResponse {

    private UUID uploadId;

    private UUID folderId;

    private String fileName;

    private Long fileSize;

    private Integer totalChunks;

    private UploadStatus status;
}
