package com.sy.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.sy.context.BaseContext;
import com.sy.dto.ShoppingCartDTO;
import com.sy.entity.Dish;
import com.sy.entity.Setmeal;
import com.sy.entity.ShoppingCart;
import com.sy.mapper.DishMapper;
import com.sy.mapper.SetmealMapper;
import com.sy.service.ShoppingCartService;
import com.sy.mapper.ShoppingCartMapper;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
* @author kokomi
* @description 针对表【shopping_cart(ショッピングカート)】的数据库操作Service实现
* @createDate 2025-08-06 22:25:11
*/
@Service
public class ShoppingCartServiceImpl extends ServiceImpl<ShoppingCartMapper, ShoppingCart>
    implements ShoppingCartService{
    @Autowired
    private ShoppingCartMapper shoppingCartMapper;

    @Autowired
    private DishMapper dishMapper;

    @Autowired
    private SetmealMapper setmealMapper;

    @Override
    public void addShoppingCart(ShoppingCartDTO shoppingCartDTO) {
        ShoppingCart shoppingCart = new ShoppingCart();
        BeanUtils.copyProperties(shoppingCartDTO, shoppingCart);
        Long currentId = BaseContext.getCurrentId();
        shoppingCart.setUserId(currentId);
        List<ShoppingCart> shoppingCarts = shoppingCartMapper.list(shoppingCart);
        if(shoppingCarts!=null && shoppingCarts.size()>0){
            ShoppingCart cart = shoppingCarts.get(0);
            cart.setNumber(cart.getNumber()+1);
            shoppingCartMapper.updateNumberById(cart);
        }else {
            Long dishId = shoppingCartDTO.getDishId();
            if(dishId!=null){
                //A new dish is added to the shopping cart
                Dish dish = dishMapper.selectById(dishId);
                shoppingCart.setName(dish.getName());
                shoppingCart.setImage(dish.getImage());
                shoppingCart.setAmount(dish.getPrice());

            }else {
                //A new setmeal is added to the shopping cart
                Long setmealId = shoppingCartDTO.getSetmealId();
                Setmeal setmeal = setmealMapper.selectById(setmealId);
                shoppingCart.setName(setmeal.getName());
                shoppingCart.setImage(setmeal.getImage());
                shoppingCart.setAmount(setmeal.getPrice());
            }
            shoppingCart.setNumber(1);
            //TODO:验证一下这createtime有没有更新
//            shoppingCart.setCreateTime(LocalDateTime.now());
            shoppingCartMapper.insert(shoppingCart);
        }

    }

    /**
     * ショッピングカートから商品を削除する
     * Remove an item from the shopping cart
     * @param shoppingCartDTO
     */
    @Override
    public void subShoppingCart(ShoppingCartDTO shoppingCartDTO) {
        ShoppingCart shoppingCart = new ShoppingCart();
        BeanUtils.copyProperties(shoppingCartDTO, shoppingCart);
        shoppingCart.setUserId(BaseContext.getCurrentId());
        List<ShoppingCart> list = shoppingCartMapper.list(shoppingCart);
        if(list!=null && list.size()>0){
            shoppingCart = list.get(0);
            if(shoppingCart.getNumber()==1){
                //delete the record in the shopping cart
                shoppingCartMapper.deleteById(shoppingCart.getId());
            }else {
                shoppingCart.setNumber(shoppingCart.getNumber()-1);
                shoppingCartMapper.updateNumberById(shoppingCart);
            }
        }

    }
}




