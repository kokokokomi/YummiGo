package com.sy.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;

@Data
public class GoogleLoginDTO implements Serializable {

    @Schema(description = "Google ID Token")
    private String idToken;
}

