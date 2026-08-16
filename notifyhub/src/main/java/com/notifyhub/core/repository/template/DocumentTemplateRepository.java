package com.notifyhub.core.repository.template;

import com.notifyhub.core.entity.template.DocumentTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface DocumentTemplateRepository extends JpaRepository<DocumentTemplate, UUID> {
    boolean existsByTemplateCode(String templateCode);
    Optional<DocumentTemplate> findByTemplateCode(String templateCode);
    boolean existsByTemplateCodeAndIdNot(String templateCode, UUID id);
}
