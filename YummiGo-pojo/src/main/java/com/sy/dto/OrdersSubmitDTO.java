package com.sy.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class OrdersSubmitDTO implements Serializable {
    //address id
    private Long addressBookId;
    //pay method
    private int payMethod;
    //remarks
    private String remark;
    //Estimated delivery time
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime estimatedDeliveryTime;
    //  1send out immediately  0 select delivery time
    private Integer deliveryStatus;
    //tableware num
    private Integer tablewareNumber;
    // 1 Served according to the portion size  0 select a specific quantity
    private Integer tablewareStatus;
    //packaging fee
    private Integer packAmount;
    //total price
    private BigDecimal amount;
}
