package com.notifyhub.core.repository.template;

import com.notifyhub.core.entity.template.WhatsAppTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface WhatsAppTemplateRepository extends JpaRepository<WhatsAppTemplate, UUID> {
    Optional<WhatsAppTemplate> findByTemplateCode(String templateCode);

    boolean existsByTemplateCode(String templateCode);

    boolean existsByTemplateCodeAndIdNot(String templateCode, UUID id);
}
