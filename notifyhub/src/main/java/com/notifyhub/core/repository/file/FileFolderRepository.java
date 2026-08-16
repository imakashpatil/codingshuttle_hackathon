package com.notifyhub.core.repository.file;


import com.notifyhub.core.entity.file.FileFolder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface FileFolderRepository extends JpaRepository<FileFolder, UUID> {

    boolean existsByName(String name);
}
