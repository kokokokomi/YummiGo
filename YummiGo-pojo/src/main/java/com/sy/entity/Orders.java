package com.sy.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Date;

/**
 * @TableName orders
 */
@TableName(value ="orders")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Orders implements Serializable {
    /**
     * status
     */
    public static final Integer PENDING_PAYMENT = 1;
    public static final Integer TO_BE_CONFIRMED = 2;
    public static final Integer CONFIRMED = 3;
    public static final Integer DELIVERY_IN_PROGRESS = 4;
    public static final Integer COMPLETED = 5;
    public static final Integer CANCELLED = 6;
    /**
     * pay status
     */
    public static final Integer UN_PAID = 0;
    public static final Integer PAID = 1;
    public static final Integer REFUND = 2;

    private static final long serialVersionUID = 1L;

    @TableId
    private Long id;

    private String number;

    private Integer status;

    private Long userId;

    private Long addressBookId;

    private LocalDateTime orderTime;

    private LocalDateTime checkoutTime;

    private Integer payMethod;

    private String stripePaymentIntentId;

    private String stripeSessionId;

    private Integer payStatus;

    private BigDecimal amount;

    private String snapshotPhone;

    private String snapshotAddress;

    private String snapshotUserName;

    private String snapshotConsignee;

    private String cancelReason;

    private String rejectionReason;

    private LocalDateTime cancelTime;

    private LocalDateTime estimatedDeliveryTime;

    private Integer deliveryStatus;

    private LocalDateTime deliveryTime;

    private Integer packAmount;

    private Integer tablewareNumber;

    private Integer tablewareStatus;

    private Integer totalItems;

    private String summary;

    private String firstItemName;

    private String firstItemImage;

    private Integer isDeleted;

    @Version
    private Integer version;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}