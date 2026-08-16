package com.notifyhub.core.mapper.template;

import com.notifyhub.core.dto.template.request.EmailTemplateRequest;
import com.notifyhub.core.dto.template.response.EmailTemplateResponse;
import com.notifyhub.core.entity.template.EmailTemplate;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring", uses = DocumentTemplateMapper.class)
public interface EmailTemplateMapper {
    EmailTemplate toEntity(EmailTemplateRequest request);

    @Mapping(target = "documentTemplates", source = "documentTemplates")
    EmailTemplateResponse toResponse(EmailTemplate entity);

    void updateEntity(EmailTemplateRequest request, @MappingTarget EmailTemplate entity);
}
