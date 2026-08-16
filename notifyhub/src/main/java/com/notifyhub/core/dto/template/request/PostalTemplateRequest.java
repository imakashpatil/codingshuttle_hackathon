package com.notifyhub.core.dto.template.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class PostalTemplateRequest {

    @NotBlank
    private String templateCode;

    @NotBlank
    private String templateName;

    @NotNull
    private List<UUID> documentTemplateIds;

    @NotNull
    private Boolean active;
}