package com.sy.mapper;

import com.sy.entity.ShoppingCart;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;

import java.util.List;

/**
* @author kokomi
* @description 针对表【shopping_cart(ショッピングカート)】的数据库操作Mapper
* @createDate 2025-08-06 22:25:11
* @Entity com.sy.entity.ShoppingCart
*/
public interface ShoppingCartMapper extends BaseMapper<ShoppingCart> {

    //select if there's any same dish in the shopping cart
    List<ShoppingCart> list(ShoppingCart shoppingCart);

    //update number in shopping cart
    void updateNumberById(ShoppingCart cart);
}




