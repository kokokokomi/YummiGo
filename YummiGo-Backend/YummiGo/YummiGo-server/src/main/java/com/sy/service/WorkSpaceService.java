package com.sy.service;


import com.sy.vo.BusinessDataVO;
import com.sy.vo.DishOverViewVO;
import com.sy.vo.OrderOverViewVO;
import com.sy.vo.SetmealOverViewVO;

import java.time.LocalDateTime;

public interface WorkSpaceService {
    //get today's business data
    BusinessDataVO getBusinessData(LocalDateTime begin, LocalDateTime end);

    //get order overview data
    OrderOverViewVO getOrderOverView();

    //get dish overview data
    DishOverViewVO getDishOverViewVO();

    //get setmeals's suspension of sales
    SetmealOverViewVO getSetmealOverViewVO();
}
