package com.sy.service;


import com.sy.vo.BusinessDataVO;
import com.sy.vo.DishOverViewVO;
import com.sy.vo.OrderOverViewVO;

import java.time.LocalDateTime;

public interface WorkSpaceService {
    //get today's business data
    BusinessDataVO getBusinessData(LocalDateTime begin, LocalDateTime end);

    //get order overview data
    OrderOverViewVO getOrderOverView();

    //get today's dish overview data
    DishOverViewVO getDishOverViewVO();
}
