package com.notifyhub.core.mapper.template;

import com.notifyhub.core.dto.template.request.SmsTemplateRequest;
import com.notifyhub.core.dto.template.response.SmsTemplateResponse;
import com.notifyhub.core.entity.template.SmsTemplate;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring", uses = DocumentTemplateMapper.class)
public interface SmsTemplateMapper {

    SmsTemplate toEntity(SmsTemplateRequest request);

    @Mapping(target = "documentTemplates", source = "documentTemplates")
    SmsTemplateResponse toResponse(SmsTemplate entity);

    void updateEntity(SmsTemplateRequest request, @MappingTarget SmsTemplate entity);
}
