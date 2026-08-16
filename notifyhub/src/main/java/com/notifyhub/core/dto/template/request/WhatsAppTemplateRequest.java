package com.notifyhub.core.dto.template.request;

import com.notifyhub.shared.validation.ValidXML;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class WhatsAppTemplateRequest {

    @NotBlank
    private String templateCode;

    @NotBlank
    private String templateName;

    @NotBlank
    private String message;

    @NotBlank
    @ValidXML
    private String xmlPayloadFormat;

    @NotNull
    private List<UUID> documentTemplateIds;
}
