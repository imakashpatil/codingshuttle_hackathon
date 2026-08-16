package com.notifyhub.core.batch.communication;

import com.notifyhub.core.batch.dto.CommunicationImportRecord;
import com.notifyhub.core.entity.file.FileMetadata;
import com.notifyhub.core.service.file.FileService;
import lombok.extern.slf4j.Slf4j;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.UUID;

@Slf4j
public class CommunicationFailedRecordWriter {

    private final FileService fileService;
    private final UUID fileId;
    private FileMetadata failureFile;
    private Path failedFile;
    private boolean initialized = false;

    public CommunicationFailedRecordWriter(FileService fileService, UUID fileId) {
        this.fileService = fileService;
        this.fileId = fileId;
    }

    public void write(CommunicationImportRecord item, Exception exception) {
        String line = String.join(
                ",",
                csv(item.getCustomerId()),
                csv(item.getCommunicationDefinitionCode()),
                csv(item.getCommunicationData()),
                csv(exception.getMessage())
        ) + System.lineSeparator();

        try {
            if (!initialized) {
                String header = "customerId,communicationDefinitionCode,communicationData,error" + System.lineSeparator();
                failureFile = fileService.createFailureFile(fileId, header + line);
                failedFile = Path.of(failureFile.getStoragePath());
                initialized = true;
                return;
            }

            Files.writeString(failedFile, line, StandardOpenOption.APPEND);
            fileService.updateFailureFileMetadata(failureFile);

        } catch (Exception e) {
            throw new IllegalStateException("Unable to write failed communication record", e);
        }
    }

    private String csv(String value) {
        if (value == null) {
            return "";
        }
        return "\"" + value.replace("\"", "\"\"") + "\"";
    }
}
