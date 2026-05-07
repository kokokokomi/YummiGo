package com.sy.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DishItemVO implements Serializable {

    // 料理名
    private String name;

    // 数量（注文部数）
    private Integer copies;

    // 单价
    private BigDecimal price;

    // 料理画像
    private String image;

    // 料理説明
    private String description;
}
