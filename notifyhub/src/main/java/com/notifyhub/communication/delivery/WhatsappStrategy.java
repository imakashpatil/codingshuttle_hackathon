package com.notifyhub.communication.delivery;

import com.notifyhub.communication.exception.DeliveryException;
import com.notifyhub.communication.delivery.whatsapp.PhoneNumberNormalizer;
import com.notifyhub.communication.delivery.whatsapp.WhatsappMessage;
import com.notifyhub.communication.delivery.whatsapp.WhatsappMessageBuilder;
import com.notifyhub.communication.delivery.whatsapp.ZavuClient;
import com.notifyhub.communication.entity.Communication;
import com.notifyhub.communication.exception.DeliveryException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class WhatsappStrategy implements DeliveryStrategy {

    private final ZavuClient zavuClient;
    private final WhatsappMessageBuilder messageBuilder;

    @Override
    public void send(
            Communication communication,
            Map<String, Object> payload) {

        try {
            log.info(
                    "Executing WhatsApp strategy for communication ID: {}",
                    communication.getId()
            );

            String phone = PhoneNumberNormalizer.normalize(
                    communication.getMobileNumber()
            );

            WhatsappMessage message =
                    messageBuilder.build(communication, payload);

            zavuClient.send(phone, message);

        } catch (Exception e) {

            log.error(
                    "WhatsApp delivery failed for communication ID: {}",
                    communication.getId(),
                    e
            );

            throw new DeliveryException(
                    "WhatsApp delivery failed: " + e.getMessage(),
                    e
            );
        }
    }

    @Override
    public String getChannel() {
        return "WHATSAPP";
    }
}