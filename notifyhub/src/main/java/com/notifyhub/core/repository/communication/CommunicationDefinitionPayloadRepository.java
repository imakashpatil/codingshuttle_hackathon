package com.notifyhub.core.repository.communication;

import com.notifyhub.core.entity.communication.CommunicationDefinitionPayload;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CommunicationDefinitionPayloadRepository extends JpaRepository<CommunicationDefinitionPayload, UUID> {
}