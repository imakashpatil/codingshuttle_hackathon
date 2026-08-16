package com.notifyhub.core.service.template;


import com.notifyhub.core.dto.template.request.DocumentTemplateRequest;
import com.notifyhub.core.dto.template.response.DocumentTemplateResponse;
import com.notifyhub.core.entity.template.DocumentTemplate;
import com.notifyhub.core.mapper.template.DocumentTemplateMapper;
import com.notifyhub.core.repository.template.DocumentTemplateRepository;
import com.notifyhub.shared.exception.DuplicateResourceException;
import com.notifyhub.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class  DocumentTemplateService {

    private final DocumentTemplateRepository documentTemplateRepository;
    private final DocumentTemplateMapper documentTemplateMapper;

    public DocumentTemplateResponse create(
            DocumentTemplateRequest request) {

        if (documentTemplateRepository.existsByTemplateCode(request.getTemplateCode())) {
            throw new DuplicateResourceException("Document template with code '" + request.getTemplateCode() + "' already exists");
        }

        DocumentTemplate template = documentTemplateMapper.toEntity(request);

        template.setVersion(1);

        DocumentTemplate saved = documentTemplateRepository.save(template);
        System.out.println((saved.getCreatedAt()));
        return documentTemplateMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public DocumentTemplateResponse getById(UUID id) {

        DocumentTemplate template = documentTemplateRepository
                        .findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Document template with id '" + id + "' not found"));
        return documentTemplateMapper.toResponse(template);
    }

    @Transactional(readOnly = true)
    public List<DocumentTemplateResponse> getAll() {

        return documentTemplateRepository.findAll()
                .stream()
                .map(documentTemplateMapper::toResponse)
                .toList();
    }

    public DocumentTemplateResponse update(
            UUID id,
            DocumentTemplateRequest request) {

        DocumentTemplate template = documentTemplateRepository
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document template with id '" + id + "' not found"));

        if (documentTemplateRepository.existsByTemplateCodeAndIdNot(request.getTemplateCode(), id)) {

            throw new DuplicateResourceException("Document template with code '" + request.getTemplateCode() + "' already exists");
        }

        documentTemplateMapper.updateEntity(
                request,
                template
        );

        template.setVersion(template.getVersion() + 1);

        DocumentTemplate updated =
                documentTemplateRepository.save(template);

        return documentTemplateMapper.toResponse(updated);
    }

    public void delete(UUID id) {

        DocumentTemplate template = documentTemplateRepository
                                    .findById(id)
                                    .orElseThrow(() -> new ResourceNotFoundException("Document template with id '" + id + "' not found"));
        documentTemplateRepository.delete(template);
    }
}
