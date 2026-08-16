package com.notifyhub.core.repository.template;

import com.notifyhub.core.entity.template.PostalTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PostalTemplateRepository extends JpaRepository<PostalTemplate, UUID> {

    Optional<PostalTemplate> findByTemplateCode(String templateCode);

    boolean existsByTemplateCode(String templateCode);

    boolean existsByTemplateCodeAndIdNot(String templateCode, UUID id);
}
