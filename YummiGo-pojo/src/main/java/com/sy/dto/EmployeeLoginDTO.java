package com.sy.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import lombok.Data;

import java.io.Serializable;

@Data
@Schema(description = "社員登録時に渡されるデータモデル")
public class EmployeeLoginDTO implements Serializable {

    @Schema(description = "ユーザー名")
    private String username;

    @Schema(description = "パスワード")
    private String password;
}