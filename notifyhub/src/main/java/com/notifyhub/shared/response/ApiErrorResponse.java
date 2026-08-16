package com.notifyhub.shared.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ApiErrorResponse {

    private boolean success;

    private String code;

    private String message;
}
