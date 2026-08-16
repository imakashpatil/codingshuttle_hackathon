package com.notifyhub.communication.delivery.whatsapp;

public final class PhoneNumberNormalizer {

    private PhoneNumberNormalizer() {
    }

    public static String normalize(String phone) {

        if (phone == null || phone.isBlank()) {
            throw new IllegalArgumentException(
                    "Mobile phone number missing for WhatsApp routing"
            );
        }

        phone = phone.trim()
                .replaceAll("[^0-9+]", "");

        if (!phone.startsWith("+")) {

            if (phone.length() == 10) {
                return "+91" + phone;
            }

            return "+" + phone;
        }

        return phone;
    }
}
