package com.notifyhub.core.batch.dto;

import com.notifyhub.core.enums.ImportType;
import lombok.*;

import java.util.UUID;

@Getter
@Builder
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ImportStatusResponse{
    private UUID submissionId;
    private ImportType importType;
    private String status;
    private long totalRecords;
    private long processedRecords;
    private long failedRecords;
}
