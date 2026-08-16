package com.notifyhub.core.mapper.template;

import com.notifyhub.core.dto.template.request.PostalTemplateRequest;
import com.notifyhub.core.dto.template.response.PostalTemplateResponse;
import com.notifyhub.core.entity.template.PostalTemplate;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring", uses = DocumentTemplateMapper.class)
public interface PostalTemplateMapper {

        PostalTemplate toEntity(PostalTemplateRequest request);

        @Mapping(target = "documentTemplates", source = "documentTemplates")
        PostalTemplateResponse toResponse(PostalTemplate entity);

        void updateEntity(
                        PostalTemplateRequest request,
                        @MappingTarget PostalTemplate entity);
}
