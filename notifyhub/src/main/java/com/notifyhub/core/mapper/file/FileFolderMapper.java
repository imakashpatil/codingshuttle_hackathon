package com.notifyhub.core.mapper.file;

import com.notifyhub.core.dto.file.request.FileFolderRequest;
import com.notifyhub.core.dto.file.response.FileFolderResponse;
import com.notifyhub.core.entity.file.FileFolder;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring", uses = {FileUploadMapper.class})
public interface FileFolderMapper {

    FileFolder toEntity(FileFolderRequest request);

    FileFolderResponse toResponse(FileFolder entity);
}
