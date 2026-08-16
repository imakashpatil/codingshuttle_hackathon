package com.notifyhub.core.batch.customer;

import com.notifyhub.core.batch.dto.CustomerImportRecord;
import com.notifyhub.core.entity.customer.Customer;
import com.notifyhub.core.enums.CommunicationChannel;
import com.notifyhub.core.enums.Language;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.infrastructure.item.ItemProcessor;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
public class CustomerItemProcessor implements ItemProcessor<CustomerImportRecord, Customer> {

    @Override
    public Customer process(CustomerImportRecord item) {
        log.info(
                "Processing customer record: code={}, name={}, email={}",
                item.getCustomerCode(),
                item.getName(),
                item.getEmail()
        );

        validate(item);
        Language language = parseLanguage(item.getPreferredLanguage());
        Set<CommunicationChannel> channels = parseChannels(item.getPreferredChannels());

        return Customer.builder()
                .customerCode(item.getCustomerCode())
                .name(item.getName())
                .email(item.getEmail())
                .mobileNumber(item.getMobileNumber())
                .preferredLanguage(language)
                .preferredChannels(channels)
                .addressLine1(item.getAddressLine1())
                .addressLine2(item.getAddressLine2())
                .addressLine3(item.getAddressLine3())
                .city(item.getCity())
                .postalCode(item.getPostalCode())
                .active(true)
                .build();
    }

    private void validate(CustomerImportRecord item) {

        if (isBlank(item.getCustomerCode())) {
            throw new IllegalArgumentException("Customer code is required");
        }

        if (isBlank(item.getName())) {
            throw new IllegalArgumentException("Customer name is required");
        }

        if (isBlank(item.getEmail())) {
            throw new IllegalArgumentException("Customer email is required");
        }

        if (isBlank(item.getMobileNumber())) {
            throw new IllegalArgumentException("Customer mobile number is required");
        }

        if (isBlank(item.getPreferredLanguage())) {
            throw new IllegalArgumentException("Preferred language is required");
        }
    }

    private Language parseLanguage(String value) {

        try {
            return Language.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid preferred language: " + value);
        }
    }

    private Set<CommunicationChannel> parseChannels(String value) {
        if (isBlank(value)) return Set.of();


        try {
            return Arrays.stream(value.split(","))
                    .map(String::trim)
                    .filter(channel -> !channel.isBlank())
                    .map(String::toUpperCase)
                    .map(CommunicationChannel::valueOf)
                    .collect(Collectors.toSet());

        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid preferred channel: " + value);
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}