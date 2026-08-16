package com.notifyhub.core.dto.template.request;


import com.notifyhub.shared.validation.ValidXML;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class SmsTemplateRequest {

    @NotBlank
    private String templateCode;

    @NotBlank
    private String templateName;

    @NotBlank
    private String message;

    @NotBlank
    @ValidXML
    private String xmlPayloadFormat;

    private List<UUID> documentTemplateIds;
}
