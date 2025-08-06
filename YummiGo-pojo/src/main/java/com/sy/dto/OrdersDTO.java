package com.sy.dto;

import com.sy.entity.OrderDetail;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class OrdersDTO implements Serializable {

    private Long id;

    //注文番号
    private String number;

    //ご注文状況 1支払い待ち，2配送待ち，3配送済み，4完成，5キャンセル
    private Integer status;

    //発注者id
    private Long userId;

    //アドレスid
    private Long addressBookId;

    //注文時間
    private LocalDateTime orderTime;

    //お会計時間
    private LocalDateTime checkoutTime;

    //TODO:支付方式修改
    //支払い方法 1微信，2支付宝
    private Integer payMethod;

    //実収金額
    private BigDecimal amount;

    //備考
    private String remark;

    //ユーザー名
    private String userName;

    //携帯電話番号
    private String phone;

    //アドレス
    private String address;
    //受取人
    private String consignee;

    private List<OrderDetail> orderDetails;

}
