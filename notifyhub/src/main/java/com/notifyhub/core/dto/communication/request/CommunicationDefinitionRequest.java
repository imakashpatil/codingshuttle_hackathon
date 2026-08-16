package com.notifyhub.core.dto.communication.request;

import com.notifyhub.core.enums.CommunicationChannel;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class CommunicationDefinitionRequest {

    @NotBlank
    private String communicationCode;

    @NotBlank
    private String name;

    private String description;

    @NotEmpty
    private List<@Valid ChannelRequest> channels;

    @Getter
    @Setter
    public static class ChannelRequest {

        @NotNull
        private CommunicationChannel channel;

        @NotNull
        private UUID templateId;

        @NotNull
        private Boolean enabled = true;

        @NotNull
        private Integer priority = 1;
    }
}