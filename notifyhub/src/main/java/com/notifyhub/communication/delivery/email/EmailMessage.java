package com.notifyhub.communication.delivery.email;

import java.io.File;

public record EmailMessage(
        String from,
        String to,
        String subject,
        String htmlBody,
        File attachment,
        String attachmentName
) {
}
