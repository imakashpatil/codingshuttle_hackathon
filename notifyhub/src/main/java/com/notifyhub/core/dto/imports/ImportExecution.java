package com.notifyhub.core.dto.imports;

import com.notifyhub.core.enums.BatchImportStatus;
import com.notifyhub.core.enums.ImportType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportExecution {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private UUID fileId;

    private Long jobExecutionId;

    @Enumerated(EnumType.STRING)
    private ImportType importType;

    @Enumerated(EnumType.STRING)
    private BatchImportStatus status;

    private LocalDateTime startedAt;

    private LocalDateTime completedAt;
}