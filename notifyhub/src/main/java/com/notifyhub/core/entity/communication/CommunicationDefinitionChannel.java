package com.notifyhub.core.entity.communication;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.notifyhub.core.enums.CommunicationChannel;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(
        name = "communication_definition_channels",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_definition_channel",
                        columnNames = {
                                "communication_definition_id",
                                "channel"
                        }
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommunicationDefinitionChannel {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "communication_definition_id",
            nullable = false
    )
    @JsonBackReference
    private CommunicationDefinition communicationDefinition;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CommunicationChannel channel;

    @Column(nullable = false)
    private UUID templateId;

    @Column(nullable = false)
    @Builder.Default
    private Boolean enabled = true;

    @Column(nullable = false)
    @Builder.Default
    private Integer priority = 1;
}