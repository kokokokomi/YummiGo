package com.sy.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * データの概要
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusinessDataVO implements Serializable {

    private Double turnover;//売上

    private Integer validOrderCount;//有効注文数

    private Double orderCompletionRate;//受注完了率

    private Double unitPrice;//平均客単価

    private Integer newUsers;//新規加入者数

}
