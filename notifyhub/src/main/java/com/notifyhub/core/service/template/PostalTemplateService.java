package com.notifyhub.core.service.template;

import com.notifyhub.core.dto.template.request.PostalTemplateRequest;
import com.notifyhub.core.dto.template.response.PostalTemplateResponse;
import com.notifyhub.core.entity.template.DocumentTemplate;
import com.notifyhub.core.entity.template.PostalTemplate;
import com.notifyhub.core.mapper.template.PostalTemplateMapper;
import com.notifyhub.core.repository.template.DocumentTemplateRepository;
import com.notifyhub.core.repository.template.PostalTemplateRepository;
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
public class PostalTemplateService {

    private final PostalTemplateRepository postalTemplateRepository;

    private final DocumentTemplateRepository documentTemplateRepository;

    private final PostalTemplateMapper postalTemplateMapper;

    public PostalTemplateResponse create(PostalTemplateRequest request) {

        validateTemplateCode(request.getTemplateCode());

        PostalTemplate template = postalTemplateMapper.toEntity(request);
        template.setVersion(1);
        template.setDocumentTemplates(resolveDocumentTemplates(request.getDocumentTemplateIds()));

        PostalTemplate saved = postalTemplateRepository.save(template);

        return postalTemplateMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public PostalTemplateResponse getById(UUID id) {

        PostalTemplate template = postalTemplateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Postal template with id '" + id + "' not found"));

        return postalTemplateMapper.toResponse(template);
    }

    @Transactional(readOnly = true)
    public List<PostalTemplateResponse> getAll() {

        return postalTemplateRepository.findAll()
                .stream()
                .map(postalTemplateMapper::toResponse)
                .toList();
    }

    public PostalTemplateResponse update(UUID id, PostalTemplateRequest request) {

        PostalTemplate template = postalTemplateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Postal template with id '" + id + "' not found"));

        validateTemplateCodeForUpdate(request.getTemplateCode(), id);

        postalTemplateMapper.updateEntity(request, template);
        template.setDocumentTemplates(resolveDocumentTemplates(request.getDocumentTemplateIds()));
        template.setVersion(template.getVersion() + 1);

        PostalTemplate updated = postalTemplateRepository.save(template);

        return postalTemplateMapper.toResponse(updated);
    }

    public void delete(UUID id) {

        PostalTemplate template = postalTemplateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Postal template with id '" + id + "' not found"));

        postalTemplateRepository.delete(template);
    }

    private void validateTemplateCode(String templateCode) {

        if (postalTemplateRepository.existsByTemplateCode(templateCode)) {
            throw new DuplicateResourceException("Postal template with code '" + templateCode + "' already exists");
        }
    }

    private void validateTemplateCodeForUpdate(String templateCode, UUID id) {

        if (postalTemplateRepository.existsByTemplateCodeAndIdNot(templateCode, id)) {
            throw new DuplicateResourceException("Postal template with code '" + templateCode + "' already exists");
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