package com.notifyhub.communication.dto;

public interface DlqCountProjection {

    Long getAllCount();

    Long getEmailCount();

    Long getWhatsappCount();

    Long getSmsCount();

    Long getPostalCount();
}
