package com.notifyhub.core.batch.dto;
import lombok.*;
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerImportRecord {

    private String customerCode;

    private String name;

    private String email;

    private String mobileNumber;

    private String preferredLanguage;

    private String preferredChannels;

    private String city;

    private String postalCode;

    private String addressLine1;

    private String addressLine2;

    private String addressLine3;
}