package com.notifyhub.core.dto.user.response;


import com.notifyhub.core.enums.UserRole;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
public class UserResponse {

    private UUID id;

    private String name;

    private String email;

    private UserRole role;

    private Boolean active;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}

