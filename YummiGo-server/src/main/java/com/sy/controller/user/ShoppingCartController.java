package com.sy.controller.user;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.sy.constant.DeleteConstant;
import com.sy.context.BaseContext;
import com.sy.dto.ShoppingCartDTO;
import com.sy.entity.ShoppingCart;
import com.sy.result.Result;
import com.sy.service.ShoppingCartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController("userShoppingCartController")
@RequestMapping("user/shoppingCart")
@Tag(name = "C-shoppingCart API")
@Slf4j
public class ShoppingCartController {
    @Autowired
    private ShoppingCartService shoppingCartService;

    /**
     * Add new shopping cart
     * @param shoppingCartDTO
     * @return
     */
    @PostMapping("add")
    @Operation(summary = "add shoppingCart")
    public Result add(@RequestBody ShoppingCartDTO shoppingCartDTO) {
        log.info("shoppingCartDTO: {}", shoppingCartDTO);
        shoppingCartService.addShoppingCart(shoppingCartDTO);
        return Result.success();
    }

    /**
     *View shopping cart
     * @return
     */

    @GetMapping("list")
    @Operation(summary = "View shopping cart")
    public Result<List<ShoppingCart>> list(){
        List<ShoppingCart> list = shoppingCartService.list(
                new LambdaQueryWrapper<ShoppingCart>()
                        .eq(ShoppingCart::getUserId, BaseContext.getCurrentId())
                        .eq(ShoppingCart::getIsDeleted,DeleteConstant.NOT_DELETED)
        );
        return Result.success(list);
    }

    /**
     *Clear shopping cart based on current user ID
     * 現在のユーザーIDに基づいてショッピングカートを空にする
     * @return
     */
    @DeleteMapping("clean")
    @Operation(summary = "Clean the shoppingcart")
    public Result clean(){
        shoppingCartService.remove(
                new LambdaQueryWrapper<ShoppingCart>()
                        .eq(ShoppingCart::getIsDeleted, DeleteConstant.NOT_DELETED)
                        .eq(ShoppingCart::getUserId,BaseContext.getCurrentId())
        );
        return Result.success();
    }

    /**
     * Remove an item from the shopping cart
     * ショッピングカートから商品を削除する
     * @param shoppingCartDTO
     * @return
     */
    @PostMapping("sub")
    @Operation(summary = "Remove an item from shoppingcart")
    public Result sub(@RequestBody ShoppingCartDTO shoppingCartDTO){
        log.info("shoppingCartDTO: {}", shoppingCartDTO);
        shoppingCartService.subShoppingCart(shoppingCartDTO);
        return Result.success();
    }
}
