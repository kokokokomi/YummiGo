package com.sy.dto;

import lombok.Data;

import java.io.Serializable;

@Data
public class OrdersConfirmDTO implements Serializable {

    private Long id;
    //ご注文状況 1支払い待ち 2受注待ち 3 受注しました 4 配送中 5 完成，６　キャンセル  7 返金
    private Integer status;

}
