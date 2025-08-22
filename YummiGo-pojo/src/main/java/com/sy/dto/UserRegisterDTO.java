package com.sy.dto;


import lombok.Data;

import java.io.Serializable;

@Data
public class UserRegisterDTO implements Serializable {

    private String email;
    private String password;

    private String username;
}
