package com.notifyhub.core.mapper.communication;

import com.notifyhub.core.dto.communication.request.CommunicationDefinitionRequest;
import com.notifyhub.core.dto.communication.response.CommunicationDefinitionResponse;
import com.notifyhub.core.entity.communication.CommunicationDefinition;
import com.notifyhub.core.entity.communication.CommunicationDefinitionChannel;
import com.notifyhub.core.entity.communication.CommunicationDefinitionPayload;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface CommunicationDefinitionMapper {

    CommunicationDefinition toEntity(CommunicationDefinitionRequest request);

    @Mapping(target = "channels", source = "channels")
    @Mapping(target = "payload", source = "payload")
    CommunicationDefinitionResponse toResponse(CommunicationDefinition entity);

    @Mapping(target = "templateCode", ignore = true)
    @Mapping(target = "templateName", ignore = true)
    CommunicationDefinitionResponse.ChannelResponse toChannelResponse(
            CommunicationDefinitionChannel entity
    );

    CommunicationDefinitionResponse.PayloadResponse toPayloadResponse(
            CommunicationDefinitionPayload entity
    );

    void updateEntity(
            CommunicationDefinitionRequest request,
            @MappingTarget CommunicationDefinition entity
    );
}