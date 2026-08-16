package com.notifyhub.core.batch.customer;

import com.notifyhub.core.batch.dto.CustomerImportRecord;
import com.notifyhub.core.entity.customer.Customer;
import com.notifyhub.core.entity.file.FileMetadata;
import com.notifyhub.core.enums.FileStatus;
import com.notifyhub.core.repository.customer.CustomerRepository;
import com.notifyhub.core.repository.file.FileMetadataRepository;
import com.notifyhub.core.service.file.FileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.batch.core.job.Job;
import org.springframework.batch.core.job.JobExecution;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.listener.JobExecutionListener;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.Step;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.batch.core.configuration.annotation.StepScope;
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
@Slf4j
public class CustomerImportJobConfig {

    private final JobRepository jobRepository;
    private final PlatformTransactionManager transactionManager;

    private final CustomerRepository customerRepository;
    private final FileMetadataRepository fileMetadataRepository;
    private final FileService fileService;

    @Bean("customerImportJob")
    public Job customerImportJob(Step customerImportStep, JobExecutionListener customerJobListener) {

        return new JobBuilder("customerImportJob", jobRepository)
                .start(customerImportStep)
                .listener(customerJobListener)
                .build();
    }

    @Bean
    public JobExecutionListener customerJobListener() {
        return new JobExecutionListener() {
            @Override
            public void afterJob(@NonNull JobExecution jobExecution) {
                String fileIdStr = jobExecution.getJobParameters().getString("fileId");

                if (fileIdStr == null) {
                    return;
                }

                try {
                    UUID fileId = UUID.fromString(fileIdStr);

                    fileMetadataRepository.findById(fileId).ifPresent(file -> {
                                file.setStatus(getFileStatus(jobExecution));
                                fileMetadataRepository.save(file);
                                fileService.moveToArchive(fileId);
                    });

                } catch (Exception e) {
                    log.error("Error occured after job {}",e.getMessage());
                }
            }
        };
    }
    private FileStatus getFileStatus(JobExecution jobExecution) {

        if (jobExecution.getStatus()
                != org.springframework.batch.core.BatchStatus.COMPLETED) {
            return FileStatus.FAILED;
        }

        boolean hasSkippedRecords = jobExecution.getStepExecutions()
                .stream()
                .anyMatch(step -> step.getSkipCount() > 0);

        return hasSkippedRecords ? FileStatus.PROCESSED_WITH_ERRORS : FileStatus.PROCESSED;
    }

    @Bean
    public Step customerImportStep(
            ItemStreamReader<CustomerImportRecord> customerItemReader,
            ItemProcessor<CustomerImportRecord, Customer> customerItemProcessor,
            ItemWriter<Customer> customerItemWriter,
            CustomerSkipListener customerSkipListener
    )
    {
        return new StepBuilder("customerImportStep",jobRepository)
                .<CustomerImportRecord, Customer>chunk(50)
                .reader(customerItemReader)
                .processor(customerItemProcessor)
                .writer(customerItemWriter)
                .faultTolerant()
                .skip(IllegalArgumentException.class)
                .skipLimit(100)
                .listener(customerSkipListener)
                .transactionManager(transactionManager)
                .build();
    }

    @Bean
    @StepScope
    public ItemStreamReader<CustomerImportRecord> customerItemReader(@Value("#{jobParameters['fileId']}") String fileId) {

        FileMetadata file = fileMetadataRepository
                .findById(UUID.fromString(fileId))
                .orElseThrow(() -> new IllegalArgumentException("File not found: " + fileId));

        if (file.getStatus() == FileStatus.PROCESSED) {
            throw new IllegalStateException("File has already been successfully processed");
        }

        file.setStatus(FileStatus.PROCESSING);
        fileMetadataRepository.save(file);

        return new CustomerXmlItemReader(
                Path.of(file.getStoragePath())
        );
    }

    @Bean
    public ItemProcessor<CustomerImportRecord, Customer> customerItemProcessor() {
        return new CustomerItemProcessor();
    }

    @Bean
    public ItemWriter<Customer> customerItemWriter() {
        return new CustomerItemWriter(customerRepository);
    }

    /*
     * Creates one failed-record file for this import.
     */
    @Bean
    @StepScope
    public CustomerFailedRecordWriter customerFailedRecordWriter(@Value("#{jobParameters['fileId']}") String fileId) {
        return new CustomerFailedRecordWriter(
                fileService,
                UUID.fromString(fileId)
        );
    }

    @Bean
    @StepScope
    public CustomerSkipListener customerSkipListener(
            CustomerFailedRecordWriter failedRecordWriter) {

        return new CustomerSkipListener(
                failedRecordWriter
        );
    }
}