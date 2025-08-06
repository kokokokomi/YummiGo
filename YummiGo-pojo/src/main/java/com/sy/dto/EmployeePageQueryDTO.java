package com.sy.dto;

import lombok.Data;

import java.io.Serializable;

@Data
public class EmployeePageQueryDTO implements Serializable {

    //従業員の名前
    private String name;

    //ページ番号
    private int page;

    //ページごとに記録数が表示されます
    private int pageSize;

}
