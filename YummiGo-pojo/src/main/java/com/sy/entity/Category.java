package com.sy.entity;

import com.baomidou.mybatisplus.annotation.*;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Date;

import lombok.Builder;
import lombok.Data;

/**
 * @TableName category
 */
@TableName(value ="category")
@Data
@Builder
public class Category extends BaseEntity implements Serializable  {
    @TableId
    private Long id;

    private Integer type;

    private String name;

    private Integer sort;

    private Integer status;

    private Integer isDeleted;

    @Version
    private Integer version;
}