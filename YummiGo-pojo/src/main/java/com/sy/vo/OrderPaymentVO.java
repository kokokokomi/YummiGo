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
public class OrderPaymentVO implements Serializable {

    // ランダム文字列
    private String nonceStr;

    // 署名
    private String paySign;

    // タイムスタンプ
    private String timeStamp;

    // 署名タイプ
    private String signType;

    // 統一下注APIが返すprepay_id値
    private String packageStr;

    // 新規受注待ち件数
    private Integer waitingOrders;

}
