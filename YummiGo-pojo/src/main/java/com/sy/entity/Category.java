package com.sy.entity;

import com.baomidou.mybatisplus.annotation.*;

import java.util.Date;
import lombok.Data;

/**
 * @TableName category
 */
@TableName(value ="category")
@Data
public class Category {
    @TableId
    private Long id;

    private Integer type;

    private String name;

    private Integer sort;

    private Integer status;

    private Integer isDeleted;

    @Version
    private Integer version;

    private Date createTime;

    private Date updateTime;

    private Long createUser;

    private Long updateUser;
}