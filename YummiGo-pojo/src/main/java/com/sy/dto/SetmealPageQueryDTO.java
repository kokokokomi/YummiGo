package com.sy.dto;

import lombok.Data;

import java.io.Serializable;

@Data
public class SetmealPageQueryDTO implements Serializable {

    private int page;

    private int pageSize;

    private String name;

    //Classification id
    private Integer categoryId;

    //status 0 disable 1 enable
    private Integer status;

}
