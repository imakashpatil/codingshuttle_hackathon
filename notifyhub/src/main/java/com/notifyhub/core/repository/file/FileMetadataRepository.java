package com.notifyhub.core.repository.file;

import com.notifyhub.core.entity.file.FileMetadata;
import com.notifyhub.core.enums.FileStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FileMetadataRepository extends JpaRepository<FileMetadata, UUID> {

    List<FileMetadata> findByFolderId(UUID folderId);

    List<FileMetadata> findByStatus(FileStatus status);

    boolean existsByChecksum(String checksum);

    boolean existsByFileNameAndFolderId(String fileName, UUID folderId);

    java.util.Optional<FileMetadata> findFirstByFileNameOrderByCreatedAtDesc(String fileName);
}
