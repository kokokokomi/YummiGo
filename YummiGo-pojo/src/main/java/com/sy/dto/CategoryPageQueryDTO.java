package com.sy.dto;

import lombok.Data;

import java.io.Serializable;

@Data
public class CategoryPageQueryDTO implements Serializable {

    //ページ番号
    private int page;

    //ページごとに記録できる数
    private int pageSize;

    //分類名
    private String name;

    //カテゴリー1メニューカテゴリー2コースカテゴリー
    private Integer type;

}
