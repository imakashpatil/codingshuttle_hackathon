package com.notifyhub.core.entity.template;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "sms_templates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SmsTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String templateCode;

    @Column(nullable = false)
    private String templateName;

    /**
     * SMS message.
     *
     * Example:
     *
     * Hello {{customerName}}, your invoice {{invoiceNumber}}
     * for {{amount}} is ready.
     *
     * Download: {{documentUrl}}
     */
    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    /**
     * Sample/test XML payload for resolving placeholders.
     */
    @Column(columnDefinition = "TEXT", nullable = false)
    private String xmlPayloadFormat;

    @Column(nullable = false)
    @Builder.Default
    private Integer version = 1;

    /**
     * Documents required by this SMS template.
     *
     * The actual generated document URL is resolved
     * during sending.
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "sms_template_documents",
            joinColumns = @JoinColumn(name = "sms_template_id"),
            inverseJoinColumns = @JoinColumn(name = "document_template_id")
    )
    @Builder.Default
    private List<DocumentTemplate> documentTemplates = new ArrayList<>();

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
