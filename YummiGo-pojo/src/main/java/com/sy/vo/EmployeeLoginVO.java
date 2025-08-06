package com.sy.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "社員登録から返ってきたデータモデル")
public class EmployeeLoginVO implements Serializable {

    @Schema(description = "プレイマリキー")
    private Long id;

    @Schema(description = "ユーザー名")
    private String userName;

    @Schema(description = "名前")
    private String name;

    @Schema(description = "jwt token")
    private String token;

}

