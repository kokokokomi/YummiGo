package com.sy.entity;

import com.baomidou.mybatisplus.annotation.*;

import java.math.BigDecimal;
import lombok.Data;

/**
 * @TableName order_detail
 */
@TableName(value ="order_detail")
@Data
public class OrderDetail {
    @TableId
    private Long id;

    private String name;

    private String image;

    private Long orderId;

    private Long dishId;

    private Long setmealId;

    private String dishFlavor;

    private Integer number;

    private BigDecimal amount;

    private Integer isDeleted;

    @Version
    private Integer version;
}