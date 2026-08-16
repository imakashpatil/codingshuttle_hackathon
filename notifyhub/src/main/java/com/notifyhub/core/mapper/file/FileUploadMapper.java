package com.notifyhub.core.mapper.file;

import com.notifyhub.core.dto.file.response.FileUploadResponse;
import com.notifyhub.core.entity.file.FileMetadata;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface FileUploadMapper {

    FileUploadResponse toResponse(FileMetadata entity);
}
