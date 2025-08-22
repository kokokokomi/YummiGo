package com.sy.service;

import com.sy.dto.UserLoginDTO;
import com.sy.dto.UserUpdateDTO;
import com.sy.entity.User;
import com.baomidou.mybatisplus.extension.service.IService;
import com.sy.vo.UserLoginVO;

/**
* @author kokomi
* @description 针对表【user(ユーザー情報)】的数据库操作Service
* @createDate 2025-08-15 18:03:00
*/
public interface UserService extends IService<User> {

    //user login
    UserLoginVO login(UserLoginDTO userLoginDTO);

    //user update info
    void updateInfo(UserUpdateDTO userUpdateDTO);
}
