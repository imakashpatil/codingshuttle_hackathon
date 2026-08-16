package com.notifyhub.core.repository.template;

import com.notifyhub.core.entity.template.SmsTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SmsTemplateRepository extends JpaRepository<SmsTemplate, UUID> {
    Optional<SmsTemplate> findByTemplateCode(String templateCode);

    boolean existsByTemplateCode(String templateCode);

    boolean existsByTemplateCodeAndIdNot(String templateCode, UUID id);
}
