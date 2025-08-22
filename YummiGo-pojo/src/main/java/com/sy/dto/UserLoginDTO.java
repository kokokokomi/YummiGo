package com.sy.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;

/**
 * C-end user login
 */
@Data
public class UserLoginDTO implements Serializable {

    @Schema(description = "User email")
    private String email;

    @Schema(description = "User Pwd")
    private String password;


}
