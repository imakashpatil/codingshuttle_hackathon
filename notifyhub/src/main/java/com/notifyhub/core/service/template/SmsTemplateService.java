package com.notifyhub.core.service.template;


import com.notifyhub.core.dto.template.request.SmsTemplateRequest;
import com.notifyhub.core.dto.template.response.SmsTemplateResponse;
import com.notifyhub.core.entity.template.DocumentTemplate;
import com.notifyhub.core.entity.template.SmsTemplate;
import com.notifyhub.core.mapper.template.SmsTemplateMapper;
import com.notifyhub.core.repository.template.DocumentTemplateRepository;
import com.notifyhub.core.repository.template.SmsTemplateRepository;
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
public class SmsTemplateService {

    private final SmsTemplateRepository smsTemplateRepository;

    private final DocumentTemplateRepository documentTemplateRepository;

    private final SmsTemplateMapper smsTemplateMapper;

    @Transactional
    public SmsTemplateResponse create(SmsTemplateRequest request) {

        validateTemplateCode(request.getTemplateCode());
        SmsTemplate template = smsTemplateMapper.toEntity(request);
        template.setVersion(1);
        template.setDocumentTemplates(resolveDocumentTemplates(request.getDocumentTemplateIds()));
        SmsTemplate saved = smsTemplateRepository.save(template);

        return smsTemplateMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public SmsTemplateResponse getById(UUID id) {
        SmsTemplate template = smsTemplateRepository.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("SMS template with id '" + id + "' not found"));

        return smsTemplateMapper.toResponse(template);
    }

    @Transactional(readOnly = true)
    public List<SmsTemplateResponse> getAll() {

        return smsTemplateRepository.findAll()
                .stream()
                .map(smsTemplateMapper::toResponse)
                .toList();
    }

    @Transactional
    public SmsTemplateResponse update(UUID id, SmsTemplateRequest request) {

        SmsTemplate template = smsTemplateRepository.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("SMS template with id '" + id + "' not found"));

        validateTemplateCodeForUpdate(request.getTemplateCode(), id);

        smsTemplateMapper.updateEntity(request, template);

        template.setDocumentTemplates(resolveDocumentTemplates(request.getDocumentTemplateIds()));
        template.setVersion(template.getVersion() + 1);
        SmsTemplate updated = smsTemplateRepository.save(template);

        return smsTemplateMapper.toResponse(updated);
    }

    public void delete(UUID id) {

        SmsTemplate template = smsTemplateRepository.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("SMS template with id '" + id + "' not found"));

        smsTemplateRepository.delete(template);
    }

    private void validateTemplateCode(String templateCode) {

        if (smsTemplateRepository.existsByTemplateCode(templateCode)) {
            throw new DuplicateResourceException("SMS template with code '" + templateCode + "' already exists");
        }
    }

    private void validateTemplateCodeForUpdate(String templateCode, UUID id) {

        if (smsTemplateRepository.existsByTemplateCodeAndIdNot(templateCode, id)) {
            throw new DuplicateResourceException("SMS template with code '" + templateCode + "' already exists"
            );
        }
    }

    private List<DocumentTemplate> resolveDocumentTemplates(
            List<UUID> documentTemplateIds) {

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
