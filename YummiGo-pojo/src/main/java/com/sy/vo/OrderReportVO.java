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
public class OrderReportVO implements Serializable {

    //日付（カンマ区切り）例: 202５-1-10,2024-11-02,2023-10-03
    private String dateList;

    // 日別注文件数（カンマ区切り）例: 260,210,215
    private String orderCountList;

    // 日別有効注文件数（カンマ区切り）例: 20,21,10
    private String validOrderCountList;

    // 注文総数
    private Integer totalOrderCount;

    // 有効注文数
    private Integer validOrderCount;

    // 注文完了率
    private Double orderCompletionRate;

}
