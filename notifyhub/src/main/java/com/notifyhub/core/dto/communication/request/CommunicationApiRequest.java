package com.notifyhub.core.dto.communication.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CommunicationApiRequest {

    @NotBlank(message = "customerId is required")
    private String customerId;

    @NotBlank(message = "communicationData is required")
    private String communicationData;
}
