package com.notifyhub.core.repository.communication;

import com.notifyhub.core.entity.communication.CommunicationRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;


@Repository
public interface CommunicationRequestRepository extends JpaRepository<CommunicationRequest, UUID> {
    List<CommunicationRequest> findByCustomerIdOrderByCreatedAtDesc(UUID customerId);
}
