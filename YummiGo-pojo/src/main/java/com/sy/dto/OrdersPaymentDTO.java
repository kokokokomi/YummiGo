package com.sy.dto;

import lombok.Data;

import java.io.Serializable;

@Data
public class OrdersPaymentDTO implements Serializable {
    private Integer payMethod;
    private Long orderId;
    private String currency;
    private String orderNumber;
    private Long amountInCents;
    private String successUrl;
    private String cancelUrl;
    private String customerEmail;

}
