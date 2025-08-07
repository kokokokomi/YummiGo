package com.sy.entity;

import com.baomidou.mybatisplus.annotation.*;

import java.time.LocalDateTime;
import java.util.Date;
import lombok.Data;

/**
 * @TableName employee
 */
@TableName(value ="employee")
@Data
public class Employee {
    @TableId
    private Long id;

    private String name;

    private String username;

    private String password;

    private String phone;

    private String sex;

    //1 ok 0 locked
    private Integer status;

    private Integer isDeleted;

    @Version
    private Integer version;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    private Long createUser;

    private Long updateUser;
}