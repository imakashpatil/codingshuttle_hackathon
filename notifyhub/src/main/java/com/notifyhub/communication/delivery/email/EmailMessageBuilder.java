package com.notifyhub.communication.delivery.email;

import com.notifyhub.communication.entity.Communication;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.File;
import java.util.Map;

@Component
public class EmailMessageBuilder {

    @Value("${spring.mail.username}")
    private String fromAddress;

    public EmailMessage build(Communication communication, Map<String, Object> payload, File pdfFile) {

        String subject = buildSubject(communication, payload);

        String htmlBody = buildBody(communication, payload);

        return new EmailMessage(
                fromAddress,
                communication.getEmail(),
                subject,
                htmlBody,
                pdfFile,
                "Attachement.pdf"
        );
    }

    private String buildSubject(Communication communication, Map<String, Object> payload) {

        String subject = communication.getId().toString();

        if (payload.containsKey("templateSubject")) {
            subject = String.valueOf(payload.get("templateSubject"));
        } else if (payload.containsKey("subject")) {
            subject = String.valueOf(payload.get("subject"));
        }

        for (Map.Entry<String, Object> entry : payload.entrySet()) {
            if (entry.getValue() != null) {
                subject = subject.replace(
                        "{{" + entry.getKey() + "}}",
                        String.valueOf(entry.getValue())
                );
            }
        }
        return subject;
    }

    private String buildBody(Communication communication, Map<String, Object> payload) {

        if (payload.containsKey("renderedHtmlEmailBody")) {
            return String.valueOf(
                    payload.get("renderedHtmlEmailBody")
            );
        }

        return "Dear " + communication.getCustomerName()
                + ",\n\n"
                + "Please find  document attached "
                + "to this email.";
    }
}
