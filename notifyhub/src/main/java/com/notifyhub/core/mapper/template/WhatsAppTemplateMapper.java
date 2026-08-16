package com.notifyhub.core.mapper.template;

import com.notifyhub.core.dto.template.request.WhatsAppTemplateRequest;
import com.notifyhub.core.dto.template.response.WhatsAppTemplateResponse;
import com.notifyhub.core.entity.template.WhatsAppTemplate;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring", uses = DocumentTemplateMapper.class)
public interface WhatsAppTemplateMapper {

    WhatsAppTemplate toEntity(WhatsAppTemplateRequest request);

    @Mapping(target = "documentTemplates", source = "documentTemplates")
    WhatsAppTemplateResponse toResponse(WhatsAppTemplate entity);

    void updateEntity(WhatsAppTemplateRequest request, @MappingTarget WhatsAppTemplate entity);
}
