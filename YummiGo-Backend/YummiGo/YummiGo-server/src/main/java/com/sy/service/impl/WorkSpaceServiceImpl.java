package com.sy.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.sy.entity.Orders;
import com.sy.entity.User;
import com.sy.mapper.OrdersMapper;
import com.sy.mapper.UserMapper;
import com.sy.service.WorkSpaceService;
import com.sy.vo.BusinessDataVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class WorkSpaceServiceImpl implements WorkSpaceService {
    @Autowired
    private OrdersMapper ordersMapper;
    @Autowired
    private UserMapper userMapper;


    @Override
    public BusinessDataVO getBusinessData(LocalDateTime begin, LocalDateTime end) {
        QueryWrapper<Orders> queryWrapper = new QueryWrapper<>();
        queryWrapper.between("create_time", begin, end)
                .eq("is_deleted", 0);
        Integer total = ordersMapper.selectCount(queryWrapper).intValue();
        queryWrapper.eq("status", Orders.COMPLETED);
        Integer valid=ordersMapper.selectCount(queryWrapper).intValue();

        //get today's turnover
        Map map=new HashMap();
        map.put("begin",begin);
        map.put("end",end);
        map.put("status", Orders.COMPLETED);
        Double turnover=ordersMapper.sumByMap(map);
        turnover=turnover == null?0.0 :turnover;

        Double orderCompletionRate =0.0;
        Double unitPrice =0.0;
        if(total!=0 && valid!=0){
            orderCompletionRate=valid.doubleValue()/total;
            unitPrice=turnover/valid;
        }

        //new user
        QueryWrapper<User> userQueryWrapper = new QueryWrapper<>();
        userQueryWrapper.between("create_time", begin, end)
                .eq("is_deleted", 0);
        Integer newUser=userMapper.selectCount(userQueryWrapper).intValue();


        return BusinessDataVO.builder()
                .turnover(turnover)
                .validOrderCount(valid)
                .orderCompletionRate(orderCompletionRate)
                .unitPrice(unitPrice)
                .newUsers(newUser)
                .build();
    }
}
