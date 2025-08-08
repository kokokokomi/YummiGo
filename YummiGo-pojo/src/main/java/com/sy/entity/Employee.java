package com.sy.entity;

import com.baomidou.mybatisplus.annotation.*;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Date;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * @TableName employee
 */
@TableName(value ="employee")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Employee extends BaseEntity implements Serializable {
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

}