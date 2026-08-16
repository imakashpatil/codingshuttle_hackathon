package com.notifyhub.communication.delivery;

import com.notifyhub.communication.entity.Communication;
import com.notifyhub.communication.exception.DeliveryException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

@Component
@Slf4j
public class SmsStrategy implements DeliveryStrategy {

    private static final int SUCCESS_RATE = 80;

    @Override
    public void send(
            Communication comm,
            Map<String, Object> payload) {

        log.info(
                "Executing SMS Strategy for Communication ID: {}",
                comm.getId()
        );

        String phone = normalizePhoneNumber(
                comm.getMobileNumber()
        );

        String textBody = extractPlainTextBody(
                payload,
                comm
        );

        /*
         * Retry behavior:
         *
         * retryCount = 0
         *     -> 80% success
         *     -> 20% failure
         *
         * retryCount >= 1
         *     -> always success
         */
        if (comm.getRetryCount() == 0) {

            int randomValue =
                    ThreadLocalRandom.current().nextInt(100);

            if (randomValue >= SUCCESS_RATE) {

                log.warn(
                        "[SMS MOCK FAILURE] Simulated SMS failure " +
                                "for Communication ID: {}",
                        comm.getId()
                );

                throw new DeliveryException("Exception", new RuntimeException("Simulated SMS provider failure for communication: " + comm.getId()));
            }
        }

        log.info(
                "[SMS MOCK SUCCESS] SMS sent to {} for Communication ID: {}. Message: {}",
                phone,
                comm.getId(),
                textBody
        );
    }

    @Override
    public String getChannel() {
        return "SMS";
    }

    private String normalizePhoneNumber(String phone) {

        if (phone == null || phone.isBlank()) {
            throw new IllegalArgumentException(
                    "Mobile phone number missing for SMS routing"
            );
        }

        phone = phone.trim()
                .replaceAll("[^0-9+]", "");

        if (!phone.startsWith("+")) {

            if (phone.length() == 10) {
                return "+91" + phone;
            }

            return "+" + phone;
        }

        return phone;
    }

    private String extractPlainTextBody(
            Map<String, Object> payload,
            Communication comm) {

        if (payload.containsKey("renderedSmsBody")) {
            return String.valueOf(
                    payload.get("renderedSmsBody")
            );
        }

        if (payload.containsKey("renderedHtmlEmailBody")) {
            return String.valueOf(
                            payload.get("renderedHtmlEmailBody")
                    )
                    .replaceAll("<[^>]+>", "")
                    .replaceAll("\\s+", " ")
                    .trim();
        }

        return "Notification from NotifyHub";
    }
}