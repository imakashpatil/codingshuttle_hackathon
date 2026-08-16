package com.notifyhub.core.batch.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommunicationImportRecord {
    private String customerId;
    private String communicationDefinitionCode;
    private String communicationData;
}
