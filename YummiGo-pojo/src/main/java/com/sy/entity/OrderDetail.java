package com.sy.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.Version;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * @TableName order_detail
 */
@TableName(value ="order_detail")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class OrderDetail {
    private static final long serialVersionUID = 1L;

    @TableId
    private Long id;

    private String snapshotName;

    private String snapshotImage;

    private Long orderId;

    private Long dishId;

    private Long setmealId;

    private String dishFlavor;

    private Integer number;

    private BigDecimal unitPrice;

    private Integer isDeleted;

    @Version
    private Integer version;
}