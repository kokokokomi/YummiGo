package com.sy.service;

import com.sy.dto.OrdersSubmitDTO;
import com.sy.entity.Orders;
import com.baomidou.mybatisplus.extension.service.IService;
import com.sy.vo.OrderSubmitVO;

/**
* @author kokomi
* @description 针对表【orders(注文表)】的数据库操作Service
* @createDate 2025-08-15 18:03:00
*/
public interface OrdersService extends IService<Orders> {

    //User order placement ユーザー注文
    OrderSubmitVO submitOrder(OrdersSubmitDTO ordersSubmitDTO);
}
