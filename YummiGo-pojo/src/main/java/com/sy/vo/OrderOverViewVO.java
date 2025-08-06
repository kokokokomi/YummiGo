package com.sy.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * 订单概览数据
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderOverViewVO implements Serializable {
    // 配達待ち件数
    private Integer deliveredOrders;

    // 完了済み件数
    private Integer completedOrders;

    // キャンセル済み件数
    private Integer cancelledOrders;

    // 全注文件数
    private Integer allOrders;
}
