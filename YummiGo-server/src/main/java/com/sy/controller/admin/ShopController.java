package com.sy.controller.admin;

import com.sy.result.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.web.bind.annotation.*;

@RestController("adminShopController")
@RequestMapping("admin/shop")
@Slf4j
@Tag(name = "Shop api")
public class ShopController {
    public static final String KEY="SHOP STATUS";

    @Autowired
    private RedisTemplate redisTemplate;

    /**
     * Set shop business status 店舗の営業状態を設定
     * Open / Closed  営業中 / 閉店中
     * @param status
     * @return
     */
    @PutMapping("/{status}")
    @Operation(summary = "Set shop status")
    public Result setShopStatus(@PathVariable Integer status){
        log.info("set shop status:{}",status==1?"open":"closed");
        redisTemplate.opsForValue().set(KEY,status);
        return Result.success();
    }

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
