package com.sy.entity;

import com.baomidou.mybatisplus.annotation.*;

import java.io.Serializable;
import java.util.Date;
import lombok.Data;

/**
 * @TableName address_book
 */
@TableName(value ="address_book")
@Data
public class AddressBook implements Serializable {
    @TableId
    private Long id;

    private Long userId;

    private String consignee;

    private String sex;

    private String phone;

    private String provinceCode;

    private String provinceName;

    private String cityCode;

    private String cityName;

    private String districtCode;

    private String districtName;

    private String detail;

    private String label;

    private Integer isDefault;

    private Integer isDeleted;

    @Version
    private Integer version;

    private Date createTime;

    private Date updateTime;
}