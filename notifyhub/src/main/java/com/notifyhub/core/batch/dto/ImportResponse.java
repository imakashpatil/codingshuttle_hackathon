package com.notifyhub.core.batch.dto;

import com.notifyhub.core.enums.ImportType;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ImportResponse {

    private UUID importExecutionId;

    private Long jobExecutionId;

    private UUID fileId;

    private String status;

    private LocalDateTime startTime;

    private ImportType importType;
}