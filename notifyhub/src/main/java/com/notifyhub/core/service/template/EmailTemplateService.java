package com.notifyhub.core.service.template;

import com.notifyhub.core.dto.template.request.EmailTemplateRequest;
import com.notifyhub.core.dto.template.response.EmailTemplateResponse;
import com.notifyhub.core.entity.template.DocumentTemplate;
import com.notifyhub.core.entity.template.EmailTemplate;
import com.notifyhub.core.mapper.template.EmailTemplateMapper;
import com.notifyhub.core.repository.template.DocumentTemplateRepository;
import com.notifyhub.core.repository.template.EmailTemplateRepository;
import com.notifyhub.shared.exception.DuplicateResourceException;
import com.notifyhub.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class EmailTemplateService {

    private final EmailTemplateRepository emailTemplateRepository;

    private final DocumentTemplateRepository documentTemplateRepository;

    private final EmailTemplateMapper emailTemplateMapper;

    public EmailTemplateResponse create(EmailTemplateRequest request) {

        validateTemplateCode(request.getTemplateCode());

        EmailTemplate template = emailTemplateMapper.toEntity(request);
        template.setVersion(1);
        template.setDocumentTemplates(resolveDocumentTemplates(request.getDocumentTemplateIds()));

        EmailTemplate saved = emailTemplateRepository.save(template);

        return emailTemplateMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public EmailTemplateResponse getById(UUID id) {

        EmailTemplate template = emailTemplateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Email template with id '" + id + "' not found"));

        return emailTemplateMapper.toResponse(template);
    }

    @Transactional(readOnly = true)
    public List<EmailTemplateResponse> getAll() {

        return emailTemplateRepository.findAll()
                .stream()
                .map(emailTemplateMapper::toResponse)
                .toList();
    }

    public EmailTemplateResponse update(UUID id, EmailTemplateRequest request) {

        EmailTemplate template = emailTemplateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Email template with id '" + id + "' not found"));

        validateTemplateCodeForUpdate(request.getTemplateCode(), id);

        emailTemplateMapper.updateEntity(request, template);
        template.setDocumentTemplates(resolveDocumentTemplates(request.getDocumentTemplateIds()));
        template.setVersion(template.getVersion() + 1);

        EmailTemplate updated = emailTemplateRepository.save(template);

        return emailTemplateMapper.toResponse(updated);
    }

    public void delete(UUID id) {

        EmailTemplate template = emailTemplateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Email template with id '" + id + "' not found"));

        emailTemplateRepository.delete(template);
    }

    private void validateTemplateCode(String templateCode) {

        if (emailTemplateRepository.existsByTemplateCode(templateCode)) {
            throw new DuplicateResourceException("Email template with code '" + templateCode + "' already exists");
        }
    }

    private void validateTemplateCodeForUpdate(String templateCode, UUID id) {

        if (emailTemplateRepository.existsByTemplateCodeAndIdNot(templateCode, id)) {
            throw new DuplicateResourceException("Email template with code '" + templateCode + "' already exists");
        }
    }

    private List<DocumentTemplate> resolveDocumentTemplates(List<UUID> documentTemplateIds) {

        if (documentTemplateIds == null || documentTemplateIds.isEmpty()) {
            return new ArrayList<>();
        }

        List<DocumentTemplate> documents = documentTemplateRepository.findAllById(documentTemplateIds);

        if (documents.size() != documentTemplateIds.size()) {
            throw new ResourceNotFoundException("One or more document templates were not found");
        }

        return documents;
    }
}
