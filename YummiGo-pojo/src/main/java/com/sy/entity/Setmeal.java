package com.sy.entity;

import com.baomidou.mybatisplus.annotation.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Date;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * @TableName setmeal
 */
@TableName(value = "setmeal")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Setmeal extends BaseEntity implements Serializable {
    @TableId
    private Long id;

    private Long categoryId;

    private String name;

    private BigDecimal price;

    private Integer status;

    private String description;

    private String image;

    private Integer isDeleted;

    @Version
    private Integer version;

}