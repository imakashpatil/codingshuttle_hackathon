package com.notifyhub.core.repository.imports;

import com.notifyhub.core.dto.imports.ImportExecution;
import com.notifyhub.core.enums.ImportType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ImportExecutionRepository extends JpaRepository<ImportExecution, UUID> {
    List<ImportExecution> findByImportTypeOrderByStartedAtDesc(ImportType importType);
}
