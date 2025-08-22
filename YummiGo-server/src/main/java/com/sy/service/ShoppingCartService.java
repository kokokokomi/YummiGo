package com.sy.service;

import com.sy.dto.ShoppingCartDTO;
import com.sy.entity.ShoppingCart;
import com.baomidou.mybatisplus.extension.service.IService;

/**
* @author kokomi
* @description 针对表【shopping_cart(ショッピングカート)】的数据库操作Service
* @createDate 2025-08-06 22:25:11
*/

public interface ShoppingCartService extends IService<ShoppingCart> {

    //Add new shopping cart
    void addShoppingCart(ShoppingCartDTO shoppingCartDTO);

    //    Remove an item from the shopping cart / ショッピングカートから商品を削除する
    void subShoppingCart(ShoppingCartDTO shoppingCartDTO);
}
