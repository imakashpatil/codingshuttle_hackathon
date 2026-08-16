package com.notifyhub.core.batch.dto;

import java.util.UUID;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import com.notifyhub.core.enums.ImportType;


@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportRequest {

    @NotNull(message = "fileId is required")
    private UUID fileId;

    @NotNull(message = "importType is required")
    private ImportType importType;

    @NotNull(message = "concurrency is required")
    @Min(value = 1, message = "concurrency must be at least 1")
    private Integer concurrency;

}