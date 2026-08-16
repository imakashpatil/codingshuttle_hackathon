package com.notifyhub.core.entity.template;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WhatsAppTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String templateCode;

    @Column(nullable = false)
    private String templateName;

    /**
     * WhatsApp message.
     *
     * Example:
     *
     * Hello {{customerName}},
     *
     * Your invoice {{invoiceNumber}} for {{amount}}
     * is ready.
     */
    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    /**
     * Sample/test payload used to resolve placeholders.
     */
    @Column(columnDefinition = "TEXT", nullable = false)
    private String xmlPayloadFormat;

    @Column(nullable = false)
    @Builder.Default
    private Integer version = 1;

    /**
     * Documents required by this WhatsApp template.
     *
     * During sending, the DocumentTemplate is used to
     * identify/generate the actual document.
     *
     * WhatsApp provider receives the document URL.
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "whatsapp_template_documents",
            joinColumns = @JoinColumn(name = "whatsapp_template_id"),
            inverseJoinColumns = @JoinColumn(name = "document_template_id")
    )
    @Builder.Default
    private List<DocumentTemplate> documentTemplates = List.of();

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
