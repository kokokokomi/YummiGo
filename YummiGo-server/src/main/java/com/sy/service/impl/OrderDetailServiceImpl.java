package com.sy.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.sy.entity.OrderDetail;
import com.sy.service.OrderDetailService;
import com.sy.mapper.OrderDetailMapper;
import org.springframework.stereotype.Service;

/**
* @author kokomi
* @description 针对表【order_detail(注文明細表)】的数据库操作Service实现
* @createDate 2025-08-06 22:25:11
*/
@Service
public class OrderDetailServiceImpl extends ServiceImpl<OrderDetailMapper, OrderDetail>
    implements OrderDetailService{

}




