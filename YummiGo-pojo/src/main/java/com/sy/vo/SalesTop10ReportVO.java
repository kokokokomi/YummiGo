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
public class SalesTop10ReportVO implements Serializable {

    // 商品名リスト（カンマ区切り）例: 麻婆豆腐,餃子,回鍋肉
    private String nameList;

    // 販売数量リスト（カンマ区切り）例: 260,215,200
    private String numberList;

}
