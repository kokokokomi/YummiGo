package com.sy.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Date;

/**
 * @TableName user
 */
@TableName(value ="user")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class User extends UpdateEntity implements Serializable {
    @TableId
    private Long id;

    private String email;

    private String password;

    private String name;

    private String avatar;

    private Integer emailVerified;

    private Date lastLoginTime;

    private String oauthProvider;

    private String oauthId;

    @Version
    private Integer version;

    private Integer isDeleted;
}