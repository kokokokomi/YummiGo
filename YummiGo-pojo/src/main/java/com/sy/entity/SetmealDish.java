package com.sy.entity;

import com.baomidou.mybatisplus.annotation.*;

import java.math.BigDecimal;
import lombok.Data;

/**
 * @TableName setmeal_dish
 */
@TableName(value ="setmeal_dish")
@Data
public class SetmealDish {
    @TableId
    private Long id;

    private Long setmealId;

    private Long dishId;

    private String name;

    private BigDecimal price;

    private Integer copies;

    private Integer isDeleted;

    @Version
    private Integer version;
}