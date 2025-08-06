package com.sy.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.util.Date;
import lombok.Data;

/**
 * @TableName employee
 */
@TableName(value ="employee")
@Data
public class Employee {
    private Long id;

    private String name;

    private String username;

    private String password;

    private String phone;

    private String sex;

    private Integer status;

    private Integer isDeleted;

    private Integer version;

    private Date createTime;

    private Date updateTime;

    private Long createUser;

    private Long updateUser;
}