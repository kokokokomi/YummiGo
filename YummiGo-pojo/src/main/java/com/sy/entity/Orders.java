package com.sy.entity;

import com.baomidou.mybatisplus.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Date;
import lombok.Data;

/**
 * @TableName orders
 */
@TableName(value ="orders")
@Data
public class Orders {
    @TableId
    private Long id;

    private String number;

    private Integer status;

    private Long userId;

    private Long addressBookId;

    private Date orderTime;

    private Date checkoutTime;

    private Integer payMethod;

    private Integer payStatus;

    private BigDecimal amount;

    private String remark;

    private String phone;

    private String address;

    private String userName;

    private String consignee;

    private String cancelReason;

    private String rejectionReason;

    private LocalDateTime cancelTime;

    private LocalDateTime estimatedDeliveryTime;

    private Integer deliveryStatus;

    private LocalDateTime deliveryTime;

    private Integer packAmount;

    private Integer tablewareNumber;

    private Integer tablewareStatus;

    private Integer isDeleted;

    @Version
    private Integer version;
}