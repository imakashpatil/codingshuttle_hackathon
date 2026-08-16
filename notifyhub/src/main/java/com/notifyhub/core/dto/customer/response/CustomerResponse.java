package com.notifyhub.core.dto.customer.response;

import com.notifyhub.core.enums.CommunicationChannel;
import com.notifyhub.core.enums.Language;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Getter
@Builder
public class CustomerResponse {

    private UUID id;

    private String customerCode;

    private String name;

    private String email;

    private String mobileNumber;

    private Language preferredLanguage;

    private Set<CommunicationChannel> preferredChannels;

    private String addressLine1;

    private String addressLine2;

    private String addressLine3;

    private String city;

    private String postalCode;

    private Boolean active;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
