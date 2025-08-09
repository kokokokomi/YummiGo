package com.sy.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.sy.entity.Orders;
import com.sy.service.OrdersService;
import com.sy.mapper.OrdersMapper;
import org.springframework.stereotype.Service;

/**
* @author kokomi
* @description 针对表【orders(注文表)】的数据库操作Service实现
* @createDate 2025-08-06 22:25:11
*/
@Service
public class OrdersServiceImpl extends ServiceImpl<OrdersMapper, Orders>
    implements OrdersService{

}




