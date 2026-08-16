package com.notifyhub.core.repository.communication;

import com.notifyhub.core.entity.communication.CommunicationDefinition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CommunicationDefinitionRepository extends JpaRepository<CommunicationDefinition, UUID> {

    Optional<CommunicationDefinition> findByCommunicationCode(String communicationCode);

    boolean existsByCommunicationCode(String communicationCode);

    boolean existsByCommunicationCodeAndIdNot(String communicationCode, UUID id);
}