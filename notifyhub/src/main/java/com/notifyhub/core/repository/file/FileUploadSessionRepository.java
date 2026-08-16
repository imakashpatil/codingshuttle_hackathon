package com.notifyhub.core.repository.file;

import com.notifyhub.core.entity.file.FileUploadSession;
import com.notifyhub.core.enums.UploadStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.UUID;

public interface FileUploadSessionRepository extends JpaRepository<FileUploadSession, UUID> {

    boolean existsByIdAndStatus(UUID id, UploadStatus status);

    @Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from FileUploadSession s where s.id = :id")
    java.util.Optional<FileUploadSession> findByIdForUpdate(UUID id);
}