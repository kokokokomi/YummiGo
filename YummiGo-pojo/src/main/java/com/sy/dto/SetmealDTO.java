package com.sy.dto;

import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import com.sy.entity.SetmealDish;

@Data
public class SetmealDTO implements Serializable {

    private Long id;

    //Classification id
    private Long categoryId;

    //set name
    private String name;

    //set price
    private BigDecimal price;

    //status
    private Integer status;


    private String description;


    private String image;

    //Relationship of set meal dishes
    private List<SetmealDish> setmealDishes = new ArrayList<>();

}
