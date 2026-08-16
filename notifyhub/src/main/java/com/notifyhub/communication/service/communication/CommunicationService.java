package com.notifyhub.communication.service.communication;

import com.notifyhub.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import com.notifyhub.communication.entity.Communication;
import com.notifyhub.communication.entity.DeliveryAttempt;
import com.notifyhub.communication.repository.CommunicationRepository;
import com.notifyhub.communication.repository.DeliveryAttemptRepository;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import java.io.File;
import java.util.List;
import java.util.Map;
import java.util.UUID;
@Service
@RequiredArgsConstructor
@Slf4j
public class CommunicationService {

    private final CommunicationRepository communicationRepository;
    private final DeliveryAttemptRepository deliveryAttemptRepository;

    public Resource getPdf(UUID id) {

        Communication communication = communicationRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Communication not found: " + id));

        if (communication.getPdfPath() == null ||
                communication.getPdfPath().isBlank()) {

            throw new ResourceNotFoundException("PDF not found for communication: " + id);
        }

        File file = new File(communication.getPdfPath());

        if (!file.exists()) {throw new ResourceNotFoundException("PDF file not found: " + communication.getPdfPath());
        }

        return new FileSystemResource(file);
    }

    public List<DeliveryAttempt> getDeliveryAttempts(UUID communicationId) {

        return deliveryAttemptRepository.findByCommunicationIdOrderByAttemptNumberAsc(communicationId);
    }

    public Communication updateCommunication(
            UUID id,
            Map<String, String> updates) {

        Communication communication = communicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Communication not found: " + id));

        updateFields(communication, updates);

        return communicationRepository.save(communication);
    }

    private void updateFields(
            Communication communication,
            Map<String, String> updates) {

        if (updates.containsKey("email")) {
            communication.setEmail(updates.get("email"));
        }

        if (updates.containsKey("mobileNumber")) {
            communication.setMobileNumber(updates.get("mobileNumber"));
        }

        if (updates.containsKey("postalAddress")) {
            communication.setPostalAddress(updates.get("postalAddress"));
        }
    }
}