package com.sy.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.sy.constant.DeleteConstant;
import com.sy.constant.MessageConstant;
import com.sy.context.BaseContext;
import com.sy.dto.GoogleLoginDTO;
import com.sy.dto.UserLoginDTO;
import com.sy.dto.UserUpdateDTO;
import com.sy.entity.User;
import com.sy.exception.AccountNotFoundException;
import com.sy.exception.LoginFailedException;
import com.sy.exception.PasswordErrorException;
import com.sy.properties.JwtProperties;
import com.sy.service.UserService;
import com.sy.mapper.UserMapper;
import com.sy.utils.JwtUtil;
import com.sy.vo.UserLoginVO;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.DigestUtils;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.Date;
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

    @Value("${sy.google.client-id:}")
    private String googleClientId;

    private RestTemplate restTemplate;

    @PostConstruct
    public void init() {
        this.restTemplate = new RestTemplate();
    }

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
        User user = userMapper.selectOne(
                new LambdaQueryWrapper<User>()
                        .eq(User::getId, currentId)
                        .eq(User::getIsDeleted, DeleteConstant.NOT_DELETED)
        );
        user.setAvatar(userUpdateDTO.getAvatar());
        user.setName(userUpdateDTO.getName());
        userMapper.updateById(user);
    }

    @Override
    public UserLoginVO googleLogin(GoogleLoginDTO googleLoginDTO) {
        if (googleLoginDTO == null || googleLoginDTO.getIdToken() == null || googleLoginDTO.getIdToken().isBlank()) {
            throw new LoginFailedException(MessageConstant.LOGIN_FAILED);
        }

        Map<String, Object> tokenInfo = verifyGoogleIdToken(googleLoginDTO.getIdToken().trim());
        String sub = tokenInfo.get("sub") != null ? tokenInfo.get("sub").toString() : null;
        String email = tokenInfo.get("email") != null ? tokenInfo.get("email").toString() : null;
        String name = tokenInfo.get("name") != null ? tokenInfo.get("name").toString() : "Google User";
        String picture = tokenInfo.get("picture") != null ? tokenInfo.get("picture").toString() : null;
        boolean emailVerified = "true".equalsIgnoreCase(String.valueOf(tokenInfo.get("email_verified")));

        if (sub == null || email == null) {
            throw new LoginFailedException(MessageConstant.LOGIN_FAILED);
        }
        if (!emailVerified) {
            throw new LoginFailedException("Googleアカウントのメール認証が必要です");
        }

        User user = userMapper.selectOne(
                new LambdaQueryWrapper<User>()
                        .eq(User::getOauthProvider, "google")
                        .eq(User::getOauthId, sub)
                        .eq(User::getIsDeleted, DeleteConstant.NOT_DELETED)
        );

        if (user == null) {
            // 兼容：如果历史账号是邮箱注册，优先绑定到旧账号
            user = userMapper.selectOne(
                    new LambdaQueryWrapper<User>()
                            .eq(User::getEmail, email)
                            .eq(User::getIsDeleted, DeleteConstant.NOT_DELETED)
            );
            if (user == null) {
                user = User.builder()
                        .email(email)
                        .name(name)
                        .avatar(picture)
                        .emailVerified(1)
                        .oauthProvider("google")
                        .oauthId(sub)
                        .password(DigestUtils.md5DigestAsHex(("google_" + sub).getBytes()))
                        .lastLoginTime(new Date())
                        .isDeleted(DeleteConstant.NOT_DELETED)
                        .version(1)
                        .build();
                userMapper.insert(user);
            } else {
                user.setOauthProvider("google");
                user.setOauthId(sub);
                user.setEmailVerified(1);
                if (user.getAvatar() == null || user.getAvatar().isBlank()) user.setAvatar(picture);
                if (user.getName() == null || user.getName().isBlank()) user.setName(name);
                user.setLastLoginTime(new Date());
                userMapper.updateById(user);
            }
        } else {
            user.setLastLoginTime(new Date());
            if (picture != null && !picture.isBlank()) user.setAvatar(picture);
            if (name != null && !name.isBlank()) user.setName(name);
            userMapper.updateById(user);
        }

        return buildLoginVO(user);
    }

    private UserLoginVO buildLoginVO(User user) {
        Instant now = Instant.now();
        long iat = now.getEpochSecond();
        long exp = now.plusMillis(jwtProperties.getUserTtl()).getEpochSecond();

        UserLoginVO userLoginVO = new UserLoginVO();
        BeanUtils.copyProperties(user, userLoginVO);

        Map<String, Object> claims = new HashMap<>();
        claims.put("email", user.getEmail());
        claims.put("userId", user.getId());
        claims.put("iat", iat);
        claims.put("exp", exp);

        String token = JwtUtil.createJWT(jwtProperties.getUserSecretKey(), jwtProperties.getUserTtl(), claims);
        userLoginVO.setToken(token);
        return userLoginVO;
    }

    private Map<String, Object> verifyGoogleIdToken(String idToken) {
        try {
            String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken;
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            Map<String, Object> body = response.getBody();
            if (body == null) {
                throw new LoginFailedException(MessageConstant.LOGIN_FAILED);
            }
            Object aud = body.get("aud");
            if (googleClientId != null && !googleClientId.isBlank() && !googleClientId.equals(aud)) {
                throw new LoginFailedException("Google client id mismatch");
            }
            return body;
        } catch (Exception e) {
            log.error("google token verify failed", e);
            throw new LoginFailedException(MessageConstant.LOGIN_FAILED);
        }
    }
}




