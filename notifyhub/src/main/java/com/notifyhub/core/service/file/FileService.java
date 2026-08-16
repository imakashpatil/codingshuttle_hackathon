package com.notifyhub.core.service.file;

import com.notifyhub.core.dto.file.request.FileUploadInitRequest;
import com.notifyhub.core.dto.file.response.FileUploadInitResponse;
import com.notifyhub.core.dto.file.response.FileUploadResponse;
import com.notifyhub.core.entity.file.FileFolder;
import com.notifyhub.core.entity.file.FileMetadata;
import com.notifyhub.core.entity.file.FileUploadSession;
import com.notifyhub.core.enums.FileStatus;
import com.notifyhub.core.enums.UploadStatus;
import com.notifyhub.core.mapper.file.FileUploadMapper;
import com.notifyhub.core.repository.file.FileFolderRepository;
import com.notifyhub.core.repository.file.FileMetadataRepository;
import com.notifyhub.core.repository.file.FileUploadSessionRepository;
import com.notifyhub.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.xml.sax.InputSource;

import javax.xml.parsers.DocumentBuilderFactory;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.nio.file.StandardOpenOption;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class FileService {

    private final FileFolderRepository fileFolderRepository;
    private final FileMetadataRepository fileMetadataRepository;
    private final FileUploadSessionRepository fileUploadSessionRepository;
    private final FileUploadMapper fileUploadMapper;

    @Value("${file.storage.base-path}")
    private String basePath;


    public FileUploadResponse upload(UUID folderId, MultipartFile file) {

        validateFile(file);

        FileFolder folder = fileFolderRepository.findById(folderId).orElseThrow(() -> new ResourceNotFoundException("Folder not found: " + folderId));

        try {

            validateXml(file.getInputStream());
            String checksum = calculateChecksum(file.getInputStream());
            Path folderPath = Paths.get(folder.getPath());
            Files.createDirectories(folderPath);
            String uniqueFileName = resolveUniqueFileName(folderPath, file.getOriginalFilename(), folderId);
            assert uniqueFileName != null;
            Path filePath = folderPath.resolve(uniqueFileName);
            Files.copy(file.getInputStream(), filePath);

            FileMetadata metadata = FileMetadata.builder()
                    .folder(folder)
                    .fileName(uniqueFileName)
                    .contentType(file.getContentType())
                    .fileSize(file.getSize())
                    .checksum(checksum)
                    .status(FileStatus.READY)
                    .storagePath(filePath.toString())
                    .build();

            return fileUploadMapper.toResponse(fileMetadataRepository.save(metadata));

        } catch (Exception exception) {

            throw new IllegalStateException("Unable to upload file: " + file.getOriginalFilename(), exception);
        }
    }


    public void moveToArchive(UUID fileId) {

        FileMetadata file = getFile(fileId);

        Path source = Paths.get(file.getStoragePath());

        Path archivePath = Paths.get(file.getFolder().getPath()).resolve("archive").resolve(file.getFileName());

        try {

            Files.createDirectories(archivePath.getParent());

            Files.move(source, archivePath, StandardCopyOption.REPLACE_EXISTING);

            file.setStoragePath(archivePath.toString());

            fileMetadataRepository.save(file);

        } catch (IOException exception) {

            throw new IllegalStateException("Unable to move file to archive: " + file.getFileName(), exception);
        }
    }


    public Path getFailureFilePath(UUID fileId) {

        FileMetadata file = getFile(fileId);

        String failureFileName = removeExtension(file.getFileName()) + "_failed.csv";

        return Paths.get(file.getFolder().getPath()).resolve("failures").resolve(failureFileName);
    }


    public void delete(UUID fileId) {

        FileMetadata file = getFile(fileId);

        try {

            Files.deleteIfExists(Paths.get(file.getStoragePath()));

            fileMetadataRepository.delete(file);

        } catch (IOException exception) {

            throw new IllegalStateException("Unable to delete file: " + file.getFileName(), exception);
        }
    }


    public void deleteFailureFile(UUID fileId) {

        Path failurePath = getFailureFilePath(fileId);

        try {

            Files.deleteIfExists(failurePath);

        } catch (IOException exception) {

            throw new IllegalStateException("Unable to delete failure file", exception);
        }
    }


    private FileMetadata getFile(UUID fileId) {

        return fileMetadataRepository.findById(fileId).orElseThrow(() -> new ResourceNotFoundException("File not found: " + fileId));
    }


    private String removeExtension(String fileName) {

        int dotIndex = fileName.lastIndexOf('.');

        if (dotIndex <= 0) {
            return fileName;
        }

        return fileName.substring(0, dotIndex);
    }


    private void validateFile(MultipartFile file) {

        if (file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }
        String fileName = file.getOriginalFilename();
        if (fileName == null || !fileName.toLowerCase().endsWith(".xml")) {
            throw new IllegalArgumentException("Only XML files are supported");
        }
    }


    private void validateXml(InputStream inputStream) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(true);
        factory.newDocumentBuilder().parse(new InputSource(inputStream));
    }


    private String calculateChecksum(InputStream inputStream) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] buffer = new byte[8192];
        int bytesRead;
        while ((bytesRead = inputStream.read(buffer)) != -1) {
            digest.update(buffer, 0, bytesRead);
        }

        return HexFormat.of().formatHex(digest.digest());
    }


    public FileUploadInitResponse initializeUpload(FileUploadInitRequest request) {

        FileFolder folder = fileFolderRepository.findById(request.getFolderId())
                .orElseThrow(() -> new ResourceNotFoundException("Folder not found: " + request.getFolderId()));

        if (!request.getFileName().toLowerCase().endsWith(".xml")) {
            throw new IllegalArgumentException("Only XML files are supported");
        }

        if (request.getFileSize() <= 0 || request.getTotalChunks() <= 0) {
            throw new IllegalArgumentException("Invalid file size or chunk count");
        }

        Path folderPath = Paths.get(folder.getPath());

        String uniqueFileName = resolveUniqueFileName(folderPath, request.getFileName(), folder.getId());

        FileUploadSession session = FileUploadSession
                .builder()
                .folder(folder)
                .fileName(uniqueFileName)
                .fileSize(request.getFileSize())
                .totalChunks(request.getTotalChunks())
                .uploadedChunks(0)
                .status(UploadStatus.INITIATED)
                .temporaryPath("")
                .build();

        session = fileUploadSessionRepository.save(session);

        UUID uploadId = session.getId();

        Path temporaryPath = Paths.get(basePath, ".tmp", uploadId.toString());

        try {
            Files.createDirectories(temporaryPath);
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to create temporary upload directory", exception);
        }

        session.setTemporaryPath(temporaryPath.toString());

        fileUploadSessionRepository.save(session);

        return FileUploadInitResponse.builder()
                .uploadId(uploadId)
                .folderId(folder.getId())
                .fileName(uniqueFileName)
                .fileSize(request.getFileSize())
                .totalChunks(request.getTotalChunks())
                .status(UploadStatus.INITIATED)
                .build();
    }


    public void uploadChunk(UUID uploadId, Integer chunkNumber, MultipartFile chunk) {

        FileUploadSession session = fileUploadSessionRepository.findByIdForUpdate(uploadId)
                .orElseThrow(() -> new ResourceNotFoundException("Upload session not found: " + uploadId));

        if (chunkNumber < 0 || chunkNumber >= session.getTotalChunks()) {
            throw new IllegalArgumentException("Invalid chunk number");
        }

        if (chunk.isEmpty()) {
            throw new IllegalArgumentException("Chunk cannot be empty");
        }

        Path chunkPath = Paths.get(session.getTemporaryPath(), String.valueOf(chunkNumber));

        try {
            Files.copy(chunk.getInputStream(), chunkPath, StandardCopyOption.REPLACE_EXISTING);
            session.setStatus(UploadStatus.UPLOADING);
            long uploadedChunks;

            try (var paths = Files.list(Paths.get(session.getTemporaryPath()))) {
                uploadedChunks = paths.count();
            }

            session.setUploadedChunks((int) uploadedChunks);

            fileUploadSessionRepository.save(session);

        } catch (Exception exception) {
            throw new IllegalStateException("Unable to upload chunk: " + chunkNumber, exception);
        }
    }


    public FileUploadResponse completeUpload(UUID uploadId) {

        FileUploadSession session = fileUploadSessionRepository.findById(uploadId)
                .orElseThrow(() -> new ResourceNotFoundException("Upload session not found: " + uploadId));

        if (session.getUploadedChunks() != session.getTotalChunks()) {
            throw new IllegalStateException("Not all chunks have been uploaded");
        }

        Path temporaryPath = Paths.get(session.getTemporaryPath());

        Path finalPath = Paths.get(session.getFolder().getPath(), session.getFileName());

        try {
            Files.deleteIfExists(finalPath);
            try (var outputStream = Files.newOutputStream(finalPath)) {

                for (int i = 0; i < session.getTotalChunks(); i++) {

                    Path chunkPath = temporaryPath.resolve(String.valueOf(i));

                    Files.copy(chunkPath, outputStream);
                }
            }

            validateXml(Files.newInputStream(finalPath));

            String checksum = calculateChecksum(Files.newInputStream(finalPath));

            FileMetadata metadata = FileMetadata.builder()
                    .folder(session.getFolder())
                    .fileName(session.getFileName())
                    .contentType("application/xml")
                    .fileSize(Files.size(finalPath))
                    .checksum(checksum)
                    .status(FileStatus.READY)
                    .storagePath(finalPath.toString())
                    .build();

            FileMetadata saved = fileMetadataRepository.save(metadata);
            session.setStatus(UploadStatus.COMPLETED);
            fileUploadSessionRepository.save(session);
            deleteDirectory(temporaryPath);

            return fileUploadMapper.toResponse(saved);

        } catch (Exception exception) {

            session.setStatus(UploadStatus.FAILED);
            fileUploadSessionRepository.save(session);
            throw new IllegalStateException("Unable to complete upload", exception);
        }
    }


    public static void deleteDirectory(Path path) throws IOException {

        if (!Files.exists(path)) {
            return;
        }

        try (var paths = Files.walk(path)) {
            paths.sorted((first, second) -> second.compareTo(first)).forEach(currentPath -> {
                try {
                    Files.deleteIfExists(currentPath);
                } catch (IOException exception) {
                    throw new RuntimeException(exception);
                }
            });
        }
    }


    private String resolveUniqueFileName(Path folderPath, String originalFilename, UUID folderId) {
        if (originalFilename == null) {
            return null;
        }
        String baseName = originalFilename;
        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');

        if (dotIndex > 0) {
            baseName = originalFilename.substring(0, dotIndex);
            extension = originalFilename.substring(dotIndex);
        }

        Path filePath = folderPath.resolve(originalFilename);

        int counter = 1;

        String uniqueName = originalFilename;

        while (Files.exists(filePath) || fileMetadataRepository.existsByFileNameAndFolderId(uniqueName, folderId)) {

            uniqueName = baseName + " _" + counter + "_" + extension;
            filePath = folderPath.resolve(uniqueName);
            counter++;
        }
        return uniqueName;
    }

    public FileMetadata createFailureFile(UUID fileId, String content) {
        FileMetadata originalFile = getFile(fileId);
        Path failureFilePath = getFailureFilePath(fileId);

        try {

            Files.createDirectories(failureFilePath.getParent());
            Files.writeString(failureFilePath, content, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
            long fileSize = Files.size(failureFilePath);

            String checksum = calculateChecksum(Files.newInputStream(failureFilePath));

            FileMetadata failureFile = FileMetadata.builder()
                    .folder(originalFile.getFolder())
                    .fileName(failureFilePath.getFileName().toString())
                    .contentType("text/csv")
                    .fileSize(fileSize)
                    .checksum(checksum)
                    .status(FileStatus.PROCESSED)
                    .storagePath(failureFilePath.toString()).build();

            return fileMetadataRepository.save(failureFile);

        } catch (Exception exception) {

            throw new IllegalStateException("Unable to create failure file for: " + originalFile.getFileName(), exception);
        }
    }

    public void updateFailureFileMetadata(FileMetadata failureFile) {

        try {

            Path path = Paths.get(failureFile.getStoragePath());

            failureFile.setFileSize(Files.size(path));
            failureFile.setChecksum(calculateChecksum(Files.newInputStream(path)));

            fileMetadataRepository.save(failureFile);

        } catch (Exception exception) {
            throw new IllegalStateException("Unable to update failure file metadata: " + failureFile.getFileName(), exception);
        }
    }


}