package com.notifyhub.core.service.template;

import com.notifyhub.core.dto.template.request.WhatsAppTemplateRequest;
import com.notifyhub.core.dto.template.response.WhatsAppTemplateResponse;
import com.notifyhub.core.entity.template.DocumentTemplate;
import com.notifyhub.core.entity.template.WhatsAppTemplate;
import com.notifyhub.core.mapper.template.WhatsAppTemplateMapper;
import com.notifyhub.core.repository.template.DocumentTemplateRepository;
import com.notifyhub.core.repository.template.WhatsAppTemplateRepository;
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
public class WhatsAppTemplateService {

    private final WhatsAppTemplateRepository whatsAppTemplateRepository;

    private final DocumentTemplateRepository documentTemplateRepository;

    private final WhatsAppTemplateMapper whatsAppTemplateMapper;

    public WhatsAppTemplateResponse create(WhatsAppTemplateRequest request) {

        validateTemplateCode(request.getTemplateCode());

        WhatsAppTemplate template = whatsAppTemplateMapper.toEntity(request);
        template.setVersion(1);
        template.setDocumentTemplates(resolveDocumentTemplates(request.getDocumentTemplateIds()));

        WhatsAppTemplate saved = whatsAppTemplateRepository.save(template);

        return whatsAppTemplateMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public WhatsAppTemplateResponse getById(UUID id) {

        WhatsAppTemplate template = whatsAppTemplateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "WhatsApp template with id '" + id + "' not found"
                ));

        return whatsAppTemplateMapper.toResponse(template);
    }

    @Transactional(readOnly = true)
    public List<WhatsAppTemplateResponse> getAll() {

        return whatsAppTemplateRepository.findAll()
                .stream()
                .map(whatsAppTemplateMapper::toResponse)
                .toList();
    }

    public WhatsAppTemplateResponse update(UUID id, WhatsAppTemplateRequest request) {

        WhatsAppTemplate template = whatsAppTemplateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "WhatsApp template with id '" + id + "' not found"
                ));

        validateTemplateCodeForUpdate(request.getTemplateCode(), id);

        whatsAppTemplateMapper.updateEntity(request, template);
        template.setDocumentTemplates(resolveDocumentTemplates(request.getDocumentTemplateIds()));
        template.setVersion(template.getVersion() + 1);

        WhatsAppTemplate updated = whatsAppTemplateRepository.save(template);

        return whatsAppTemplateMapper.toResponse(updated);
    }

    public void delete(UUID id) {

        WhatsAppTemplate template = whatsAppTemplateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("WhatsApp template with id '" + id + "' not found"));

        whatsAppTemplateRepository.delete(template);
    }

    private void validateTemplateCode(String templateCode) {

        if (whatsAppTemplateRepository.existsByTemplateCode(templateCode)) {
            throw new DuplicateResourceException("WhatsApp template with code '" + templateCode + "' already exists");
        }
    }

    private void validateTemplateCodeForUpdate(String templateCode, UUID id) {

        if (whatsAppTemplateRepository.existsByTemplateCodeAndIdNot(templateCode, id)) {
            throw new DuplicateResourceException("WhatsApp template with code '" + templateCode + "' already exists");
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
