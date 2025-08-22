package com.sy.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserLoginVO implements Serializable {

    @Schema(description = "UserID")
    private Long id;

    @Schema(description = "token")
    private String token;

    @Schema(description = "user name")
    private String name;
    @Schema
    private Boolean firstLogin;

}
