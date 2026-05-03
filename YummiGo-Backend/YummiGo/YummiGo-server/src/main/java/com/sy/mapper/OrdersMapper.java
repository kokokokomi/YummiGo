package com.sy.mapper;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sy.dto.GoodsSalesDTO;
import com.sy.dto.OrdersPageQueryDTO;
import com.sy.entity.Orders;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.sy.vo.OrderStatisticsVO;
import com.sy.vo.OrderVO;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
* @author kokomi
* @description 针对表【orders(注文表)】的数据库操作Mapper
* @createDate 2025-08-15 18:03:00
* @Entity com.sy.entity.Orders
*/
public interface OrdersMapper extends BaseMapper<Orders> {

    /**get sales top 10*/
    List<GoodsSalesDTO> getSalesTop10(LocalDateTime begin, LocalDateTime end);

    //
    Integer countByStatus(Integer toBeConfirmed);

    List<OrderVO> selectOrderVOPage(Page<OrderVO> page, @Param("dto") OrdersPageQueryDTO dto);

    /** 商家工作台：待接单、待派送、派送中数量（与 Orders 状态常量一致） */
    OrderStatisticsVO selectOrderStatistics();

    Double sumByMap(Map map);
}




