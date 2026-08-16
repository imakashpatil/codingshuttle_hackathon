package com.notifyhub.core.batch.service;

import com.notifyhub.core.batch.dto.ImportRequest;
import com.notifyhub.core.batch.dto.ImportResponse;
import com.notifyhub.core.dto.imports.ImportExecution;
import com.notifyhub.core.entity.file.FileMetadata;
import com.notifyhub.core.enums.BatchImportStatus;
import com.notifyhub.core.enums.ImportType;
import com.notifyhub.core.repository.file.FileMetadataRepository;
import com.notifyhub.core.repository.imports.ImportExecutionRepository;
import com.notifyhub.core.service.file.FileService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.core.job.Job;
import org.springframework.batch.core.job.JobExecution;
import org.springframework.batch.core.job.parameters.JobParameters;
import org.springframework.batch.core.job.parameters.JobParametersBuilder;
import org.springframework.batch.core.launch.JobOperator;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
public class ImportService {

    private final JobOperator jobOperator;
    private final JdbcTemplate jdbcTemplate;

    private final Job customerImportJob;
    private final Job communicationImportJob;

    private final ImportExecutionRepository importExecutionRepository;
    private final FileMetadataRepository fileMetadataRepository;
    private final FileService fileService;

    public ImportService(JobOperator jobOperator, JdbcTemplate jdbcTemplate, @Qualifier("customerImportJob") Job customerImportJob, @Qualifier("communicationImportJob") Job communicationImportJob, ImportExecutionRepository importExecutionRepository, FileMetadataRepository fileMetadataRepository, FileService fileService) {
        this.jobOperator = jobOperator;
        this.jdbcTemplate = jdbcTemplate;
        this.customerImportJob = customerImportJob;
        this.communicationImportJob = communicationImportJob;
        this.importExecutionRepository = importExecutionRepository;
        this.fileMetadataRepository = fileMetadataRepository;
        this.fileService = fileService;
    }

    /**
     * Starts the requested import job and stores the application-level
     * mapping between file and Spring Batch job execution.
     */
    public ImportResponse importData(ImportRequest request) throws Exception {

        Job job = getJob(request.getImportType());

        JobParameters jobParameters = new JobParametersBuilder().addString("fileId", request.getFileId().toString()).addString("importType", request.getImportType().name()).addLong("concurrency", request.getConcurrency() != null ? request.getConcurrency().longValue() : 1L).addLong("timestamp", System.currentTimeMillis()).toJobParameters();

        JobExecution jobExecution = jobOperator.start(job, jobParameters);

        ImportExecution importExecution = ImportExecution.builder().fileId(request.getFileId()).jobExecutionId(jobExecution.getId()).importType(request.getImportType()).status(BatchImportStatus.STARTING).startedAt(jobExecution.getStartTime()).build();

        importExecution = importExecutionRepository.save(importExecution);

        return ImportResponse.builder().importExecutionId(importExecution.getId()).jobExecutionId(jobExecution.getId()).fileId(request.getFileId()).importType(request.getImportType()).status(jobExecution.getStatus().name()).startTime(jobExecution.getStartTime()).build();
    }

    /**
     * Returns import execution information using Spring Batch metadata
     * tables as the source of truth for job/step execution information.
     * <p>
     * Metrics:
     * <p>
     * read_count          -> totalRecords
     * write_count         -> successCount
     * process_skip_count  -> failureCount
     * rollback_count      -> retryCount
     */
    public List<Map<String, Object>> getImportExecutions(ImportType importType) {

        String jobName = switch (importType) {
            case CUSTOMER -> "customerImportJob";
            case COMMUNICATION -> "communicationImportJob";
        };

        String sql = """
                SELECT
                    i.job_execution_id,
                    i.file_id,
                    i.import_type,
                
                    ji.job_instance_id,
                    ji.job_name,
                
                    je.create_time,
                    je.start_time,
                    je.end_time,
                    je.status,
                    je.exit_code,
                    je.exit_message,
                
                    MAX(
                        CASE
                            WHEN p.parameter_name = 'concurrency'
                            THEN p.parameter_value
                        END
                    ) AS concurrency,
                
                    se.read_count,
                    se.write_count,
                    se.process_skip_count,
                    se.read_skip_count,
                    se.write_skip_count,
                    se.rollback_count
                
                FROM import_execution i
                
                JOIN batch_job_execution je
                    ON je.job_execution_id = i.job_execution_id
                
                JOIN batch_job_instance ji
                    ON ji.job_instance_id = je.job_instance_id
                
                LEFT JOIN batch_job_execution_params p
                    ON p.job_execution_id = je.job_execution_id
                
                LEFT JOIN batch_step_execution se
                    ON se.job_execution_id = je.job_execution_id
                
                WHERE i.import_type = ?
                  AND ji.job_name = ?
                
                GROUP BY
                    i.job_execution_id,
                    i.file_id,
                    i.import_type,
                
                    ji.job_instance_id,
                    ji.job_name,
                
                    je.create_time,
                    je.start_time,
                    je.end_time,
                    je.status,
                    je.exit_code,
                    je.exit_message,
                
                    se.read_count,
                    se.write_count,
                    se.process_skip_count,
                    se.read_skip_count,
                    se.write_skip_count,
                    se.rollback_count
                
                ORDER BY je.start_time DESC
                """;

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, importType.name(), jobName);

        List<Map<String, Object>> result = new ArrayList<>();

        for (Map<String, Object> row : rows) {

            Map<String, Object> response = new HashMap<>();

            /*
             * ---------------------------------------------------------
             * Job identifiers
             * ---------------------------------------------------------
             */

            Long jobExecutionId = getLong(row, "job_execution_id");

            Long jobInstanceId = getLong(row, "job_instance_id");

            response.put("id", jobExecutionId);
            response.put("jobExecutionId", jobExecutionId);
            response.put("jobInstanceId", jobInstanceId);

            /*
             * ---------------------------------------------------------
             * File information
             * ---------------------------------------------------------
             */

            UUID fileId = null;

            Object fileIdValue = row.get("file_id");

            if (fileIdValue != null) {
                fileId = UUID.fromString(fileIdValue.toString());
            }

            response.put("fileId", fileId);

            String fileName = "Unknown File";

            if (fileId != null) {

                fileName = fileMetadataRepository.findById(fileId).map(FileMetadata::getFileName).orElse("Unknown File");
            }

            response.put("fileName", fileName);

            /*
             * ---------------------------------------------------------
             * Job information
             * ---------------------------------------------------------
             */

            response.put("importType", row.get("import_type"));

            response.put("jobName", row.get("job_name"));

            response.put("status", row.get("status"));

            response.put("exitCode", row.get("exit_code"));

            response.put("exitDescription", row.get("exit_message"));

            response.put("createTime", row.get("create_time"));

            response.put("startTime", row.get("start_time"));

            response.put("endTime", row.get("end_time"));

            /*
             * ---------------------------------------------------------
             * Thread count
             * ---------------------------------------------------------
             */

            int threadCount = 1;

            Object concurrency = row.get("concurrency");

            if (concurrency != null) {

                try {
                    threadCount = Integer.parseInt(concurrency.toString());
                } catch (NumberFormatException e) {

                    log.warn("Invalid concurrency value '{}' for job execution {}", concurrency, jobExecutionId);
                }
            }

            response.put("threadCount", threadCount);

            /*
             * ---------------------------------------------------------
             * Spring Batch step metrics
             * ---------------------------------------------------------
             *
             * read_count
             *      = total records read/processed
             *
             * write_count
             *      = successfully created communication/customer records
             *
             * process_skip_count
             *      = records skipped during processing
             *
             * rollback_count
             *      = retry/rollback count
             */

            long totalRecords = getLongValue(row, "read_count");

            long successCount = getLongValue(row, "write_count");

            long failureCount = getLongValue(row, "process_skip_count");

            long retryCount = getLongValue(row, "rollback_count");

            response.put("totalRecords", totalRecords);

            response.put("successCount", successCount);

            response.put("failureCount", failureCount);

            response.put("retryCount", retryCount);

            /*
             * ---------------------------------------------------------
             * Add failure log if failures exist
             * ---------------------------------------------------------
             */

            if (failureCount > 0 && fileId != null) {

                try {

                    java.nio.file.Path failureFilePath = fileService.getFailureFilePath(fileId);

                    if (java.nio.file.Files.exists(failureFilePath)) {

                        String errorLog = java.nio.file.Files.readString(failureFilePath);

                        response.put("errorLog", errorLog);
                    }

                } catch (Exception e) {

                    log.warn("Unable to read failure file for fileId {}", fileId, e);
                }
            }

            result.add(response);
        }

        return result;
    }

    private Job getJob(ImportType importType) {

        return switch (importType) {

            case CUSTOMER -> customerImportJob;

            case COMMUNICATION -> communicationImportJob;
        };
    }

    private Long getLong(Map<String, Object> row, String column) {

        Object value = row.get(column);

        if (value == null) {
            return null;
        }

        return ((Number) value).longValue();
    }

    private long getLongValue(Map<String, Object> row, String column) {

        Object value = row.get(column);

        if (value == null) {
            return 0L;
        }

        return ((Number) value).longValue();
    }
}