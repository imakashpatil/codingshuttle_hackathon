package com.notifyhub.core.mapper.template;

import com.notifyhub.core.dto.template.request.DocumentTemplateRequest;
import com.notifyhub.core.dto.template.response.DocumentTemplateResponse;
import com.notifyhub.core.entity.template.DocumentTemplate;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface DocumentTemplateMapper {
    DocumentTemplate toEntity(DocumentTemplateRequest request);

    DocumentTemplateResponse toResponse(DocumentTemplate entity);

    void updateEntity(DocumentTemplateRequest request, @MappingTarget DocumentTemplate entity
    );
}
