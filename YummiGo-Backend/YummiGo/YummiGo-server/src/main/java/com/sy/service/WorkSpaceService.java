package com.sy.service;


import com.sy.vo.BusinessDataVO;

import java.time.LocalDateTime;

public interface WorkSpaceService {
    //get today's business data
    BusinessDataVO getBusinessData(LocalDateTime begin, LocalDateTime end);
}
