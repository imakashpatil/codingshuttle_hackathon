package com.notifyhub.core.batch.communication;

import com.notifyhub.core.batch.dto.CommunicationImportRecord;
import com.notifyhub.core.entity.communication.CommunicationRequest;
import com.notifyhub.core.entity.file.FileMetadata;
import com.notifyhub.core.enums.FileStatus;
import com.notifyhub.core.repository.communication.CommunicationDefinitionRepository;
import com.notifyhub.core.repository.communication.CommunicationRequestRepository;
import com.notifyhub.core.repository.file.FileMetadataRepository;
import com.notifyhub.communication.repository.OutboxEventRepository;
import com.notifyhub.core.repository.template.*;
import com.notifyhub.core.service.file.FileService;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.core.job.Job;
import org.springframework.batch.core.job.JobExecution;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.listener.JobExecutionListener;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.Step;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.batch.infrastructure.item.ItemProcessor;
import org.springframework.batch.infrastructure.item.ItemStreamReader;
import org.springframework.batch.infrastructure.item.ItemWriter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;

import java.nio.file.Path;
import java.util.UUID;

@Configuration
@RequiredArgsConstructor

public class CommunicationImportJobConfig {

    private final JobRepository jobRepository;
    private final PlatformTransactionManager transactionManager;

    private final CommunicationRequestRepository communicationRequestRepository;
    private final CommunicationDefinitionRepository communicationDefinitionRepository;
    private final FileMetadataRepository fileMetadataRepository;
    private final FileService fileService;
    private final com.notifyhub.core.repository.customer.CustomerRepository customerRepository;

    @Bean("communicationImportJob")
    public Job communicationImportJob(Step communicationImportStep, JobExecutionListener communicationJobListener) {
        return new JobBuilder("communicationImportJob", jobRepository)
                .start(communicationImportStep)
                .listener(communicationJobListener)
                .build();
    }

    @Bean
    public JobExecutionListener communicationJobListener() {
        return new JobExecutionListener() {
            @Override
            public void afterJob(@NonNull JobExecution jobExecution) {
                String fileIdStr = jobExecution.getJobParameters().getString("fileId");
                if (fileIdStr != null) {
                    try {
                        UUID fileId = UUID.fromString(fileIdStr);
                        fileMetadataRepository.findById(fileId).ifPresent(file -> {
                            file.setStatus(getFileStatus(jobExecution));
                            fileMetadataRepository.save(file);
                            fileService.moveToArchive(fileId);
                        });
                    } catch (Exception e) {
                        // ignore
                    }
                }
            }
        };
    }

    private FileStatus getFileStatus(JobExecution jobExecution) {
        if (jobExecution.getStatus() != org.springframework.batch.core.BatchStatus.COMPLETED) {
            return FileStatus.FAILED;
        }
        boolean hasSkippedRecords = jobExecution.getStepExecutions()
                .stream()
                .anyMatch(step -> step.getSkipCount() > 0);
        return hasSkippedRecords ? FileStatus.PROCESSED_WITH_ERRORS : FileStatus.PROCESSED;
    }

    @Bean
    public Step communicationImportStep(
            ItemStreamReader<CommunicationImportRecord> communicationItemReader,
            ItemProcessor<CommunicationImportRecord, CommunicationRequest> communicationItemProcessor,
            ItemWriter<CommunicationRequest> communicationItemWriter,
            CommunicationSkipListener communicationSkipListener) {

        return new StepBuilder("communicationImportStep", jobRepository)
                .<CommunicationImportRecord, CommunicationRequest>chunk(50)
                .reader(communicationItemReader)
                .processor(communicationItemProcessor)
                .writer(communicationItemWriter)
                .faultTolerant()
                .skip(IllegalArgumentException.class)
                .skipLimit(100)
                .listener(communicationSkipListener)
                .transactionManager(transactionManager)
                .build();
    }

    @Bean
    @StepScope
    public ItemStreamReader<CommunicationImportRecord> communicationItemReader(@Value("#{jobParameters['fileId']}") String fileId) {

        FileMetadata file = fileMetadataRepository
                .findById(UUID.fromString(fileId))
                .orElseThrow(() -> new IllegalArgumentException("File not found: " + fileId));

        if (file.getStatus() == FileStatus.PROCESSED) {
            throw new IllegalStateException("File has already been successfully processed");
        }

        file.setStatus(FileStatus.PROCESSING);
        fileMetadataRepository.save(file);

        return new CommunicationXmlItemReader(Path.of(file.getStoragePath()));
    }

    @Bean
    public ItemProcessor<CommunicationImportRecord, CommunicationRequest> communicationItemProcessor() {
        return new CommunicationItemProcessor(communicationDefinitionRepository, customerRepository);
    }

    @Bean
    public ItemWriter<CommunicationRequest> communicationItemWriter(OutboxEventRepository outboxEventRepository) {
        return new CommunicationItemWriter(communicationRequestRepository, outboxEventRepository);
    }

    @Bean
    @StepScope
    public CommunicationFailedRecordWriter communicationFailedRecordWriter(@Value("#{jobParameters['fileId']}") String fileId) {
        return new CommunicationFailedRecordWriter(fileService, UUID.fromString(fileId));
    }

    @Bean
    @StepScope
    public CommunicationSkipListener communicationSkipListener(CommunicationFailedRecordWriter failedRecordWriter) {
        return new CommunicationSkipListener(failedRecordWriter);
    }
}
