package com.sy.dto;

import lombok.Data;

import java.io.Serializable;

@Data
public class OrdersCancelDTO implements Serializable {

    private Long id;
    //ご注文のキャンセル理由
    private String cancelReason;

}
