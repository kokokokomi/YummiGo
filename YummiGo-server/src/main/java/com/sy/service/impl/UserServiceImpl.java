package com.sy.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.sy.constant.MessageConstant;
import com.sy.context.BaseContext;
import com.sy.dto.UserLoginDTO;
import com.sy.dto.UserUpdateDTO;
import com.sy.entity.User;
import com.sy.exception.AccountNotFoundException;
import com.sy.exception.PasswordErrorException;
import com.sy.properties.JwtProperties;
import com.sy.service.UserService;
import com.sy.mapper.UserMapper;
import com.sy.utils.JwtUtil;
import com.sy.vo.UserLoginVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.DigestUtils;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
* @author kokomi
* @description 针对表【user(ユーザー情報)】的数据库操作Service实现
* @createDate 2025-08-15 18:03:00
*/
@Service
@Slf4j
public class UserServiceImpl extends ServiceImpl<UserMapper, User>
    implements UserService{
    @Autowired
    private UserMapper userMapper;

    @Autowired
    private JwtProperties jwtProperties;

    @Override
    public UserLoginVO login(UserLoginDTO userLoginDTO) {

        Instant now = Instant.now();
        long iat = now.getEpochSecond(); // 当前时间（秒）
        long exp = now.plusMillis(jwtProperties.getUserTtl()).getEpochSecond();

        User user = userMapper.selectOne(new LambdaQueryWrapper<User>().eq(User::getEmail, userLoginDTO.getEmail()));
        if(user ==null){
            throw new AccountNotFoundException(MessageConstant.ACCOUNT_NOT_FOUND);
        }
        String password=userLoginDTO.getPassword();
        password = DigestUtils.md5DigestAsHex(password.getBytes());
        if(!user.getPassword().equals(password)){
            throw new PasswordErrorException(MessageConstant.PASSWORD_ERROR);
        }
        UserLoginVO userLoginVO = new UserLoginVO();
        BeanUtils.copyProperties(user,userLoginVO);

        Map<String,Object> claims=new HashMap<>();
        claims.put("email",user.getEmail());
        claims.put("userId",user.getId());
        claims.put("iat", iat);
        claims.put("exp", exp);

        String token = JwtUtil.createJWT(jwtProperties.getUserSecretKey(), jwtProperties.getUserTtl(), claims);
        userLoginVO.setToken(token);
//        log.info("怎么回事啊为什么没东西:{}",userLoginVO);
        return userLoginVO;
    }

    /**
     * user info update
     * @param userUpdateDTO
     */
    @Override
    public void updateInfo(UserUpdateDTO userUpdateDTO) {
        Long currentId = BaseContext.getCurrentId();

    }
}




