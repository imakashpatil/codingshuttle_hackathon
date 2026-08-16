package com.notifyhub.core.repository.communication;

import com.notifyhub.core.entity.communication.CommunicationDefinitionChannel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CommunicationDefinitionChannelRepository extends JpaRepository<CommunicationDefinitionChannel, UUID> {
}
