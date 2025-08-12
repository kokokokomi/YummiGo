package com.sy.controller.user;

import com.sy.result.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.web.bind.annotation.*;

@RestController("userShopController")
@RequestMapping("user/shop")
@Slf4j
@Tag(name = "Shop api")
public class ShopController {

    public static final String KEY="SHOP STATUS";
    @Autowired
    private RedisTemplate redisTemplate;

    /**
     * Get shop status /店舗状態を取得する
     */
    @GetMapping("status")
    @Operation(summary = "Get shop status")
    public Result<Integer> getShopStatus(){
        Integer shopStatus = (Integer) redisTemplate.opsForValue().get(KEY);
        log.info("get shop status:{}",shopStatus==1?"open":"closed");
        return Result.success(shopStatus);
    }
}
