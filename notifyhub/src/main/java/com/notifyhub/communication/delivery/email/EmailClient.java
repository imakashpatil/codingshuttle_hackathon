package com.notifyhub.communication.delivery.email;

import com.notifyhub.communication.exception.DeliveryException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class EmailClient {

    private final JavaMailSender mailSender;

    public void send(EmailMessage email) throws Exception {

        MimeMessage message =
                mailSender.createMimeMessage();

        MimeMessageHelper helper =
                new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(email.from());
        helper.setTo(email.to());
        helper.setSubject(email.subject());
        helper.setText(email.htmlBody(), true);

        FileSystemResource resource =
                new FileSystemResource(email.attachment());

        helper.addAttachment(
                email.attachmentName(),
                resource
        );

        try {

            mailSender.send(message);

            log.info(
                    "Email sent successfully to {}",
                    email.to()
            );

        } catch (Exception e) {

            log.error(
                    "SMTP dispatch failed for {}",
                    email.to(),
                    e
            );

            throw new DeliveryException(
                    "Failed to send email to " + email.to(),
                    e
            );
        }
    }
}