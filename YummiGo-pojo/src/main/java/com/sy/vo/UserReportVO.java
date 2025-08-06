package com.sy.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserReportVO implements Serializable {

    // 日付（カンマ区切り）例: 202５-1-10,2024-11-02,2023-10-03
    private String dateList;

    // ユーザー総数（カンマ区切り）例: 200,210,220
    private String totalUserList;

    // 新規ユーザー数（カンマ区切り）例: 20,21,10
    private String newUserList;

}
