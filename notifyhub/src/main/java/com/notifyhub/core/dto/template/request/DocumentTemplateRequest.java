package com.notifyhub.core.dto.template.request;


import com.notifyhub.shared.validation.ValidXML;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DocumentTemplateRequest {

    @NotBlank
    private String templateCode;

    @NotBlank
    private String templateName;

    @NotBlank
    private String htmlContent;

    private String cssContent;

    @NotBlank
    @ValidXML
    private String xmlPayloadFormat;
}
