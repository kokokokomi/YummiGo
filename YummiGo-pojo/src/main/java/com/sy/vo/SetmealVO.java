package com.sy.vo;

import com.sy.entity.SetmealDish;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SetmealVO implements Serializable {

    private Long id;

    // カテゴリID
    private Long categoryId;

    // セット名
    private String name;

    // セット価格
    private BigDecimal price;

    // ステータス 0:無効 1:有効
    private Integer status;

    // 説明
    private String description;

    // 画像
    private String image;

    // 更新日時
    private LocalDateTime updateTime;

    // カテゴリ名
    private String categoryName;

    // セットと料理の関連情報
    private List<SetmealDish> setmealDishes = new ArrayList<>();
}
