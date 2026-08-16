package com.notifyhub.core.entity.template;

import jakarta.persistence.*;
import lombok.*;

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
public class PostalTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column( nullable = false, unique = true)
    private String templateCode;

    @Column(nullable = false)
    private String templateName;

    @Column(nullable = false)
    @Builder.Default
    private Integer version = 1;

    /**
     * Documents that need to be printed and sent
     * through the postal channel.
     */
    @ManyToMany
    @JoinTable(
            name = "postal_template_documents",
            joinColumns = @JoinColumn(name = "postal_template_id"),
            inverseJoinColumns = @JoinColumn(name = "document_template_id")
    )
    @Builder.Default
    private List<DocumentTemplate> documentTemplates = new ArrayList<>();

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

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
