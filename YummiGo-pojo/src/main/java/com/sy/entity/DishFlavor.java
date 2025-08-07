package com.sy.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

/**
 * @TableName dish_flavor
 */
@TableName(value ="dish_flavor")
@Data
public class DishFlavor {
    @TableId
    private Long id;

    private Long dishId;

    private String name;

    private String value;

    private Integer isDeleted;

    @Version
    private Integer version;
}