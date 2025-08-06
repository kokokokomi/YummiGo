package com.sy.dto;

import com.sy.entity.DishFlavor;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
public class DishDTO implements Serializable {

    private Long id;
    //メニュー名
    private String name;
    //菜品分类id
    private Long categoryId;
    //菜品价格
    private BigDecimal price;

    private String image;

    private String description;
    //０ で打ち切り 1から
    private Integer status;
    //味
    private List<DishFlavor> flavors = new ArrayList<>();

}
