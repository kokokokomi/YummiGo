package com.sy.dto;

import lombok.Data;

import java.io.Serializable;

/**
 * C-end user login
 */
@Data
public class UserLoginDTO implements Serializable {

    private String code;

}
