package com.notifyhub.communication.delivery.whatsapp;

import com.notifyhub.communication.entity.Communication;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.File;
import java.util.Map;

@Component
public class WhatsappMessageBuilder {
    @Value("${zavu.server-url}")
    private String serverUrl;

    public WhatsappMessage build(Communication communication, Map<String, Object> payload) {

        String text = buildText(payload);

        boolean hasAttachment = Boolean.TRUE.equals(payload.get("hasRealAttachment")) || payload.containsKey("mediaUrl");

        String filename = "Document.pdf";

        if (communication.getPdfPath() != null) {
            File file = new File(communication.getPdfPath());
            filename = file.getName();
        }

        if (payload.containsKey("filename")) {
            filename = String.valueOf(
                    payload.get("filename")
            );
        }

        String mediaUrl = null;

        if (hasAttachment) {
            mediaUrl = String.valueOf(
                    payload.getOrDefault(
                            "mediaUrl",
//                            serverUrl+"/api/v1/communications/" + communication.getId() + "/pdf"
                            "https://ontheline.trincoll.edu/images/bookdown/sample-local-pdf.pdf"
                    )
            );
        }

        return new WhatsappMessage(
                text,
                hasAttachment,
                mediaUrl,
                filename
        );
    }

    private String buildText(Map<String, Object> payload) {

        if (payload.containsKey("renderedHtmlEmailBody")) {
            return stripHtml(
                    String.valueOf(
                            payload.get("renderedHtmlEmailBody")
                    )
            );
        }
        return "";
    }

    private String stripHtml(String html) {
        if (html == null) {
            return "";
        }

        return html
                .replaceAll("(?is)<style\\b[^>]*>.*?</style>", "")
                .replaceAll("(?i)<br\\s*/?>", "\n")
                .replaceAll("(?i)</p>", "\n")
                .replaceAll("<[^>]*>", "")
                .replaceAll("&nbsp;", " ")
                .replaceAll("&#169;", "©")
                .replaceAll(" +", " ")
                .trim();
    }

}