package com.notifyhub.communication.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ResolvedMessage {
    private final String htmlContent;
    private final String subject;
    private final String pdfPath;
    private final boolean realAttachment;
}
