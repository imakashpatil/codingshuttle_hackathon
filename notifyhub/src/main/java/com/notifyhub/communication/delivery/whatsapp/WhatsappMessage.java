package com.notifyhub.communication.delivery.whatsapp;

public record WhatsappMessage(
        String text,
        boolean hasAttachment,
        String mediaUrl,
        String filename
) {
}
