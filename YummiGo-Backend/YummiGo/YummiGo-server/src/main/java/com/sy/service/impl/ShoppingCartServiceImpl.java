package com.sy.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
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

import java.math.BigDecimal;
import java.math.RoundingMode;
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
        Long dishId = shoppingCartDTO.getDishId();
        Long setmealId = shoppingCartDTO.getSetmealId();
        String dishFlavor = shoppingCartDTO.getDishFlavor();
        shoppingCart.setUserId(currentId);

        LambdaQueryWrapper<ShoppingCart> query = new LambdaQueryWrapper<>();
        query.eq(ShoppingCart::getUserId, currentId);
        if (dishId != null) {
            query.eq(ShoppingCart::getDishId, dishId);
            if (dishFlavor != null) {
                query.eq(ShoppingCart::getDishFlavor, dishFlavor);
            } else {
                query.isNull(ShoppingCart::getDishFlavor);
            }
        } else if (setmealId != null) {
            query.eq(ShoppingCart::getSetmealId, setmealId);
        } else {
           return;
        }

        List<ShoppingCart> shoppingCarts = shoppingCartMapper.selectList(query);

        if(shoppingCarts!=null && shoppingCarts.size()>0){
            ShoppingCart cart = shoppingCarts.get(0);
            int newQuantity = cart.getNumber() + 1;
            BigDecimal unitPrice = cart.getAmount().divide(BigDecimal.valueOf(cart.getNumber()), 2, RoundingMode.HALF_UP);
            cart.setNumber(newQuantity);
            cart.setAmount(unitPrice.multiply(BigDecimal.valueOf(newQuantity)));

            shoppingCartMapper.updateNumberById(cart);
        }else {
            if(dishId!=null){
                //A new dish is added to the shopping cart
                Dish dish = dishMapper.selectById(dishId);
                shoppingCart.setDishId(dishId);
                shoppingCart.setName(dish.getName());
                shoppingCart.setImage(dish.getImage());
                shoppingCart.setAmount(dish.getPrice());

            }else {
                //A new setmeal is added to the shopping cart
                shoppingCart.setSetmealId(setmealId);
                Setmeal setmeal = setmealMapper.selectById(setmealId);
                shoppingCart.setName(setmeal.getName());
                shoppingCart.setImage(setmeal.getImage());
                shoppingCart.setAmount(setmeal.getPrice());
            }
            shoppingCart.setNumber(1);
            //TODO:验证一下这createtime有没有更新
//            shoppingCart.setCreateTime(LocalDateTime.now());
            System.out.println("加入的购物车项："+shoppingCart);
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
        Long currentId = BaseContext.getCurrentId();

        Long dishId = shoppingCartDTO.getDishId();
        Long setmealId = shoppingCartDTO.getSetmealId();
        String dishFlavor = shoppingCartDTO.getDishFlavor();

        LambdaQueryWrapper<ShoppingCart> query = new LambdaQueryWrapper<>();
        query.eq(ShoppingCart::getUserId, currentId);
        if (dishId != null) {
            query.eq(ShoppingCart::getDishId, dishId);
            if (dishFlavor != null) {
                query.eq(ShoppingCart::getDishFlavor, dishFlavor);
            } else {
                query.isNull(ShoppingCart::getDishFlavor);
            }
        } else if (setmealId != null) {
            query.eq(ShoppingCart::getSetmealId, setmealId);
        } else {
            throw new IllegalArgumentException("dishId and setmealId all null");
        }
        List<ShoppingCart> list = shoppingCartMapper.selectList(query);

        if(list!=null && list.size()>0){
            shoppingCart = list.get(0);
            if(shoppingCart.getNumber()==1){
                //delete the record in the shopping cart
                shoppingCartMapper.deleteById(shoppingCart.getId());
            }else {
                int newQuantity = shoppingCart.getNumber() - 1;
                BigDecimal unitPrice = shoppingCart.getAmount().divide(BigDecimal.valueOf(shoppingCart.getNumber()), 2, RoundingMode.HALF_UP);
                shoppingCart.setNumber(newQuantity);
                // update amount
                shoppingCart.setAmount(unitPrice.multiply(BigDecimal.valueOf(newQuantity)));

                shoppingCartMapper.updateNumberById(shoppingCart);
            }
        }

    }
}




