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
@Table
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String templateCode;

    @Column(nullable = false)
    private String templateName;

    /**
     * Example:
     * "Invoice {{invoiceNumber}} - {{customerName}}"
     */
    @Column(nullable = false)
    private String subject;

    /**
     * Email body.
     *
     * Example:
     *
     * <html>
     *   <body>
     *      <h1>Hello {{customerName}}</h1>
     *      <p>Your invoice {{invoiceNumber}} is ready.</p>
     *      <p>Amount: {{amount}}</p>
     *   </body>
     * </html>
     */
    @Column(columnDefinition = "TEXT", nullable = false)
    private String htmlContent;

    /**
     * CSS used by the email HTML.
     */
    @Column(columnDefinition = "TEXT")
    private String cssContent;

    /**
     * Sample/test payload used by the template editor
     * and placeholder resolution.
     */
    @Column(columnDefinition = "TEXT", nullable = false)
    private String xmlPayloadFormat;

    @Column(nullable = false)
    @Builder.Default
    private Integer version = 1;

    /**
     * Documents required by this email template.
     * Example:
     * INVOICE
     * PAYMENT_RECEIPT
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "email_template_documents",
            joinColumns = @JoinColumn(name = "email_template_id"),
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