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
public class Category implements Serializable {
    @TableId
    private Long id;

    private Integer type;

    private String name;

    private Integer sort;

    private Integer status;

    private Integer isDeleted;

    @Version
    private Integer version;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    private Long createUser;

    private Long updateUser;
}