package com.notifyhub.core.dto.file.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FileFolderRequest {

    @NotBlank
    private String name;
}
