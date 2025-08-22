package com.sy.controller.user;

import com.sy.context.BaseContext;
import com.sy.dto.UserUpdateDTO;
import com.sy.dto.UserLoginDTO;
import com.sy.entity.User;
import com.sy.result.Result;
import com.sy.service.UserService;
import com.sy.vo.UserLoginVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("user/user")
@Slf4j
@Tag(name = "C-User-API")
public class UserController {
    @Autowired
    private UserService userService;

    /**
     * User login
     * @param userLoginDTO
     * @return
     */
    @PostMapping("login")
    @Operation(summary = "User login API")
    public Result<UserLoginVO> login(@RequestBody UserLoginDTO userLoginDTO) {
        log.info("userLoginDTO:{}", userLoginDTO);
        UserLoginVO result=userService.login(userLoginDTO);
        System.out.println("login login毕竟还是v放荡不羁"+result);

        return Result.success(result);
    }

    /**
     * User logout
     * @return
     */
    @PostMapping("logout")
    @Operation(summary = "User logout API")
    public Result logout(){
        //TODO: refresh token 实现
        return Result.success();
    }


    @GetMapping("info")
    @Operation(summary = "User info API")
    public Result<User> userInfo(){
        Long currentId = BaseContext.getCurrentId();
        log.info("currentId:{}", currentId);
        User byId = userService.getById(currentId);
        return Result.success(byId);
    }

    /**
     *Update user info
     * @param
     * @return
     */
    @PutMapping("updateInfo")
    @Operation(summary = "Update user info")
    public Result updateInfo(@RequestBody UserUpdateDTO userUpdateDTO) {
        Long userId = BaseContext.getCurrentId();
        userService.updateInfo(userUpdateDTO);
        return Result.success();
    }



}
