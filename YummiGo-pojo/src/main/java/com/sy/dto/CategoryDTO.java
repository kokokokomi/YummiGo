package com.sy.dto;

import lombok.Data;

import java.io.Serializable;

@Data
public class CategoryDTO implements Serializable {

    //primary key
    private Long id;

    //type1 メニューの分類 2 コース分類
    private Integer type;

    //type name
    private String name;

    private Integer sort;

}
