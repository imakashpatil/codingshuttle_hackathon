package com.notifyhub.core.service.file;

import com.notifyhub.core.dto.file.request.FileFolderRequest;
import com.notifyhub.core.dto.file.response.FileFolderResponse;
import com.notifyhub.core.entity.file.FileFolder;
import com.notifyhub.core.mapper.file.FileFolderMapper;
import com.notifyhub.core.repository.file.FileFolderRepository;
import com.notifyhub.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class FileFolderService {

    private final FileFolderRepository fileFolderRepository;
    private final FileFolderMapper fileFolderMapper;

    @Value("${file.storage.base-path}")
    private String basePath;

    public FileFolderResponse create(FileFolderRequest request) {

        if (fileFolderRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException(
                    "Folder already exists: " + request.getName()
            );
        }

        Path folderPath = Paths.get(
                basePath,
                request.getName()
        );

        Path archivePath = folderPath.resolve("archive");
        Path failuresPath = folderPath.resolve("failures");

        try {
            Files.createDirectories(folderPath);
            Files.createDirectories(archivePath);
            Files.createDirectories(failuresPath);

        } catch (Exception exception) {
            throw new IllegalStateException(
                    "Unable to create folder: " + request.getName(),
                    exception
            );
        }

        FileFolder folder =
                fileFolderMapper.toEntity(request);

        folder.setPath(folderPath.toString());

        return fileFolderMapper.toResponse(
                fileFolderRepository.save(folder)
        );
    }


    @Transactional(readOnly = true)
    public List<FileFolderResponse> getAll() {

        return fileFolderRepository.findAll()
                .stream()
                .map(fileFolderMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public FileFolderResponse getById(UUID id) {

        FileFolder folder = getEntity(id);

        return fileFolderMapper.toResponse(folder);
    }

    public void delete(UUID id) {

        FileFolder folder = getEntity(id);

        try {
            Path folderPath =
                    Paths.get(folder.getPath());

            if (Files.exists(folderPath)) {
                deleteDirectory(folderPath);
            }

            fileFolderRepository.delete(folder);

        } catch (Exception exception) {

            throw new IllegalStateException(
                    "Unable to delete folder: "
                            + folder.getName(),
                    exception
            );
        }
    }

    private FileFolder getEntity(UUID id) {

        return fileFolderRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Folder not found: " + id
                        )
                );
    }

    private void deleteDirectory(Path path)
            throws Exception {

        try (var paths = Files.walk(path)) {

            paths.sorted(
                            (first, second) ->
                                    second.compareTo(first)
                    )
                    .forEach(currentPath -> {

                        try {
                            Files.delete(currentPath);
                        } catch (Exception exception) {
                            throw new RuntimeException(
                                    exception
                            );
                        }
                    });
        }
    }
}