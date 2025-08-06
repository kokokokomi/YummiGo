package com.sy.vo;

import lombok.Data;

import java.io.Serializable;

@Data
public class OrderStatisticsVO implements Serializable {
    // 受注待ち数量
    private Integer toBeConfirmed;

    // 出荷待ち数量
    private Integer confirmed;

    // 配達中数量
    private Integer deliveryInProgress;
}
