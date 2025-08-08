package com.sy.entity;

import com.baomidou.mybatisplus.annotation.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Date;
import lombok.Data;

/**
 * @TableName shopping_cart
 */
@TableName(value ="shopping_cart")
@Data
public class ShoppingCart implements Serializable {
    @TableId
    private Long id;

    private String name;

    private String image;

    private Long userId;

    private Long dishId;

    private Long setmealId;

    private String dishFlavor;

    private Integer number;

    private BigDecimal amount;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    private Integer isDeleted;

    @Version
    private Integer version;
}