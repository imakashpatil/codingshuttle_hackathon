package com.notifyhub.communication.repository;

import com.notifyhub.communication.entity.DeliveryAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DeliveryAttemptRepository extends JpaRepository<DeliveryAttempt, UUID> {
    List<DeliveryAttempt> findByCommunicationIdOrderByAttemptNumberAsc(UUID communicationId);
    Optional<DeliveryAttempt> findByCommunicationId(UUID communicationId);
}
