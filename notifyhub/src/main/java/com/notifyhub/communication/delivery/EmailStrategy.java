package com.notifyhub.communication.delivery;

import com.notifyhub.communication.delivery.email.EmailClient;
import com.notifyhub.communication.delivery.email.EmailMessage;
import com.notifyhub.communication.delivery.email.EmailMessageBuilder;
import com.notifyhub.communication.entity.Communication;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

import java.io.File;
import java.util.Map;
@Component
@RequiredArgsConstructor
@Slf4j
public class EmailStrategy implements DeliveryStrategy {

    private final EmailMessageBuilder messageBuilder;
    private final EmailClient emailClient;

    @Override
    public void send(
            Communication communication,
            Map<String, Object> payload) throws Exception {

        log.info(
                "Executing Email Strategy for Communication ID: {}",
                communication.getId()
        );

        if (communication.getPdfPath() == null ||
                communication.getPdfPath().isBlank()) {

            communication.setStatus("WAITING_FOR_PDF");

            throw new IllegalStateException(
                    "PDF invoice document is not yet compiled. " +
                            "Postponing SMTP dispatch."
            );
        }

        File pdfFile = new File(communication.getPdfPath());

        if (!pdfFile.exists()) {

            communication.setStatus("WAITING_FOR_PDF");

            throw new IllegalStateException(
                    "PDF document file missing: "
                            + communication.getPdfPath()
            );
        }

        EmailMessage email =
                messageBuilder.build(communication, payload, pdfFile);

        emailClient.send(email);

        log.info(
                "SMTP email successfully sent to: {}",
                communication.getEmail()
        );
    }

    @Override
    public String getChannel() {
        return "EMAIL";
    }
}