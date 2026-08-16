package com.notifyhub.core.dto.customer.request;
import com.notifyhub.core.enums.CommunicationChannel;
import com.notifyhub.core.enums.Language;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.Set;

@Getter
@Setter
public class CustomerRequest {

    @NotBlank
    private String customerCode;

    @NotBlank
    private String name;

    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String mobileNumber;

    @NotNull
    private Language preferredLanguage;

    private Set<CommunicationChannel> preferredChannels;

    private String addressLine1;

    private String addressLine2;

    private String addressLine3;

    private String city;

    private String postalCode;
}
