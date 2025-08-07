package com.sy.interceptor;

import com.sy.constant.JwtClaimsConstant;
import com.sy.context.BaseContext;
import com.sy.properties.JwtProperties;
import com.sy.utils.JwtUtil;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * トークンの検証
 */

@Component
@Slf4j
public class JwtTokenAdminInterceptor implements HandlerInterceptor {
    @Autowired
    private JwtProperties jwtProperties;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // 現在インターセプトしたのがControllerのメソッドか他のリソースかを判断
        if (!(handler instanceof HandlerMethod)) {
            // 現在インターセプトしたのは動的メソッドではないため、そのまま通過させる
            return true;
        }

        // 1. リクエストヘッダーからトークンを取得
        String token = request.getHeader(jwtProperties.getAdminTokenName());

        // 2. トークンの検証
        try {
            log.info("JWT検証中:{}", token);
            Claims claims = JwtUtil.parseJWT(jwtProperties.getAdminSecretKey(), token);
            Long empId = Long.valueOf(claims.get(JwtClaimsConstant.EMP_ID).toString());
            log.info("現在の従業員ID：", empId);
            BaseContext.setCurrentId(empId);
            // 3. 検証成功、通過を許可
            return true;
        } catch (Exception ex) {
            // 4. 検証失敗、401ステータスコードを返す
            response.setStatus(401);
            return false;
        }
    }
}
