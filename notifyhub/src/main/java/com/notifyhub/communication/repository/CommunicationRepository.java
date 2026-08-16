package com.notifyhub.communication.repository;

import com.notifyhub.communication.entity.Communication;
import com.notifyhub.communication.dto.DlqCountProjection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CommunicationRepository extends JpaRepository<Communication, UUID> {
    List<Communication> findByStatus(String status);
    Page<Communication> findByStatus(String status, Pageable pageable);
    Page<Communication> findByStatusAndChannel(String status, String channel, Pageable pageable);
    long countByStatus(String status);
    long countByStatusAndChannel(String status, String channel);
    List<Communication> findByRequestId(UUID requestId);
    Optional<Communication> findByRequestIdAndChannel(UUID requestId, String channel);

    @Query(value = """
    SELECT
        COUNT(*) AS allCount,
        SUM(CASE WHEN channel = 'EMAIL' THEN 1 ELSE 0 END) AS emailCount,
        SUM(CASE WHEN channel = 'WHATSAPP' THEN 1 ELSE 0 END) AS whatsappCount,
        SUM(CASE WHEN channel = 'SMS' THEN 1 ELSE 0 END) AS smsCount,
        SUM(CASE WHEN channel = 'POSTAL' THEN 1 ELSE 0 END) AS postalCount
    FROM communications
    WHERE status = 'DEAD_LETTER'
    """, nativeQuery = true)
    DlqCountProjection getDlqCounts();

}
