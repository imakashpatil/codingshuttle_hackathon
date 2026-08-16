package com.notifyhub.communication.delivery.whatsapp;

import com.notifyhub.communication.exception.DeliveryException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class ZavuClient {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${zavu.api-key:}")
    private String apiKey;

    @Value("${zavu.sender:}")
    private String senderId;

    @Value("${zavu.url:}")
    private String url;

    public void send(String phone, WhatsappMessage message) {

        if (apiKey == null || apiKey.isBlank()) {
            log.warn("Zavu API key missing. Using mock WhatsApp.");
            log.info(
                    "[WHATSAPP MOCK] To: {} | Message: {}",
                    phone,
                    message.text()
            );
            return;
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        if (senderId != null && !senderId.isBlank()) {
            headers.set("Zavu-Sender", senderId);
        }

        Map<String, Object> body = new HashMap<>();

        body.put("to", phone);
        body.put("channel", "whatsapp");
        body.put("text", message.text());

        if (message.hasAttachment()) {
            body.put("messageType", "document");

            Map<String, String> content = new HashMap<>();
            content.put("mediaUrl", message.mediaUrl());
            content.put("filename", message.filename());

            body.put("content", content);
        }

        HttpEntity<Map<String, Object>> request =
                new HttpEntity<>(body, headers);

        try {

            ResponseEntity<String> response =
                    restTemplate.postForEntity(
                            url,
                            request,
                            String.class
                    );

            log.info(
                    "Zavu response: status={}, body={}",
                    response.getStatusCode(),
                    response.getBody()
            );

        } catch (HttpClientErrorException e) {

            log.error(
                    "Zavu rejected WhatsApp request. Status: {}, Body: {}",
                    e.getStatusCode(),
                    e.getResponseBodyAsString()
            );

            throw new DeliveryException(
                    "Zavu API rejected WhatsApp request. Status: "
                            + e.getStatusCode()
                            + ", Response: "
                            + e.getResponseBodyAsString(),
                    e
            );

        } catch (HttpServerErrorException e) {

            log.error(
                    "Zavu server error. Status: {}, Body: {}",
                    e.getStatusCode(),
                    e.getResponseBodyAsString()
            );

            throw new DeliveryException(
                    "Zavu server error. Status: "
                            + e.getStatusCode(),
                    e
            );

        } catch (Exception e) {

            log.error(
                    "Unexpected error while sending WhatsApp message to Zavu",
                    e
            );

            throw new DeliveryException(
                    "Failed to send WhatsApp message via Zavu",
                    e
            );
        }
    }
}