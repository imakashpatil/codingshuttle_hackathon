package com.notifyhub.core.batch.customer;

import com.notifyhub.core.batch.dto.CustomerImportRecord;
import com.notifyhub.core.entity.file.FileMetadata;
import com.notifyhub.core.service.file.FileService;
import lombok.extern.slf4j.Slf4j;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.UUID;

@Slf4j
public class CustomerFailedRecordWriter {

    private final FileService fileService;
    private final UUID fileId;
    private FileMetadata failureFile;
    private Path failedFile;
    // for first record
    private boolean initialized = false;

    public CustomerFailedRecordWriter(FileService fileService, UUID fileId) {
        this.fileService = fileService;
        this.fileId = fileId;
    }

    public void write(CustomerImportRecord item, Exception exception) {

        String line = String.join(",",
                csv(item.getCustomerCode()),
                csv(item.getName()),
                csv(item.getEmail()),
                csv(item.getMobileNumber()),
                csv(exception.getMessage())
        ) + System.lineSeparator();

        try {
            if (!initialized) {
                String header = "customerCode,name,email,mobileNumber,error" + System.lineSeparator();
                failureFile = fileService.createFailureFile(fileId, header + line);

                failedFile = Path.of(failureFile.getStoragePath());
                initialized = true;
                return;
            }

            Files.writeString(
                    failedFile,
                    line,
                    StandardOpenOption.APPEND
            );

            fileService.updateFailureFileMetadata(failureFile);

        } catch (Exception e) {
            throw new IllegalStateException("Unable to write failed customer record", e );
        }
    }

    private String csv(String value) {
        if (value == null) {
            return "";
        }
        // format line in csv style
        return "\"" + value.replace("\"", "\"\"") + "\"";
    }
}