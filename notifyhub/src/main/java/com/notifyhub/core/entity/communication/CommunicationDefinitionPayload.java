package com.notifyhub.core.entity.communication;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "communication_definition_payloads")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommunicationDefinitionPayload {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "communication_definition_id",
            nullable = false,
            unique = true
    )
    @JsonBackReference
    private CommunicationDefinition communicationDefinition;

    @Column(
            name = "xml_schema",
            columnDefinition = "TEXT",
            nullable = false
    )
    private String xmlSchema;

    @Column(
            name = "sample_xml",
            columnDefinition = "TEXT"
    )
    private String sampleXml;

    @Column(nullable = false)
    @Builder.Default
    private Integer version = 1;

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