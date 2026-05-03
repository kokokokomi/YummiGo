package com.sy.service.impl;

import ch.qos.logback.core.model.INamedModel;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.sy.dto.GoodsSalesDTO;
import com.sy.entity.Orders;
import com.sy.entity.User;
import com.sy.mapper.OrderDetailMapper;
import com.sy.mapper.OrdersMapper;
import com.sy.mapper.UserMapper;
import com.sy.service.ReportService;
import com.sy.vo.OrderReportVO;
import com.sy.vo.SalesTop10ReportVO;
import com.sy.vo.TurnoverReportVO;
import com.sy.vo.UserReportVO;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
public class ReportServiceImpl implements ReportService {

    @Autowired
    OrdersMapper ordersMapper;

    @Autowired
    UserMapper userMapper;

    @Autowired
    OrderDetailMapper orderDetailMapper;

    /**
     * ある時間帯の売り上げ統計
     * @param begin
     * @param end
     * @return
     */
    @Override
    public TurnoverReportVO getTurnoverStatistics(LocalDate begin, LocalDate end) {

        List<LocalDate> dateList=new ArrayList<>();
        dateList.add(begin);
        while (!begin.equals(end)){
            begin=begin.plusDays(1);
            dateList.add(begin);
        }

        List<Double> turnoverList=new ArrayList<>();
        for (LocalDate date : dateList) {
            //statistics count
            //status:completed date:date
            //select sum(amount) form orders where order_time>? and order_time<? and status=order.COMPLETED
            LocalDateTime beginTime=LocalDateTime.of(date, LocalTime.MIN);
            LocalDateTime endTime=LocalDateTime.of(date, LocalTime.MAX);

            Map map=new HashMap();
            map.put("begin",beginTime);
            map.put("end",endTime);
            map.put("status", Orders.COMPLETED);
            Double turnover=ordersMapper.sumByMap(map);
            turnover=turnover == null?0.0 :turnover;
            turnoverList.add(turnover);
        }


        return TurnoverReportVO
                .builder()
                .dateList(StringUtils.join(dateList,","))
                .turnoverList(StringUtils.join(turnoverList,","))
                .build();
    }

    /**
     * ある時間帯のユーザー数統計
     * @param begin
     * @param end
     * @return
     */
    @Override
    public UserReportVO getUserStatistics(LocalDate begin, LocalDate end) {
        List<LocalDate> dateList=new ArrayList<>();
        dateList.add(begin);
        while (!begin.equals(end)){
            begin=begin.plusDays(1);
            dateList.add(begin);
        }
        //select count(id) from user where create_time<? and >? and is_deleted=0
        List<Integer> newUserList=new ArrayList<>();
        List<Integer> totalUserList=new ArrayList<>();

        for (LocalDate date : dateList) {
            LocalDateTime beginTime=LocalDateTime.of(date, LocalTime.MIN);
            LocalDateTime endTime=LocalDateTime.of(date, LocalTime.MAX);
            QueryWrapper<User> queryWrapper=new QueryWrapper<>();
            queryWrapper.between("create_time", beginTime, endTime)
                    .eq("is_deleted", 0);

            newUserList.add(userMapper.selectCount(queryWrapper).intValue());

            QueryWrapper<User> totalWrapper=new QueryWrapper<>();
            totalWrapper.lt("create_time", endTime)
                    .eq("is_deleted", 0);
            totalUserList.add(userMapper.selectCount(totalWrapper).intValue());

        }


        return UserReportVO
                .builder()
                .dateList(StringUtils.join(dateList,","))
                .newUserList(StringUtils.join(newUserList,","))
                .totalUserList(StringUtils.join(totalUserList,","))
                .build();
    }

    /**
     * 注文トータルレポート
     * @param begin
     * @param end
     * @return
     */
    @Override
    public OrderReportVO getOrderStatistics(LocalDate begin, LocalDate end) {
        List<LocalDate> dateList=new ArrayList<>();
        dateList.add(begin);
        while (!begin.equals(end)){
            begin=begin.plusDays(1);
            dateList.add(begin);
        }
        List<Integer> totalOrderList=new ArrayList<>();
        List<Integer> validOrderList=new ArrayList<>();

        for (LocalDate localDate : dateList) {
            LocalDateTime beginTime=LocalDateTime.of(localDate, LocalTime.MIN);
            LocalDateTime endTime=LocalDateTime.of(localDate, LocalTime.MAX);
            //daily total order
            QueryWrapper<Orders> totalOrderWrapper=new QueryWrapper<>();
            totalOrderWrapper.between("create_time", beginTime, endTime)
                    .eq("is_deleted", 0);
            totalOrderList.add(ordersMapper.selectCount(totalOrderWrapper).intValue());

            //daily valid order

            QueryWrapper<Orders> validOrderWrapper=new QueryWrapper<>();
            validOrderWrapper.between("create_time",beginTime, endTime)
                    .eq("status", Orders.COMPLETED)
                    .eq("is_deleted", 0);
            validOrderList.add(ordersMapper.selectCount(validOrderWrapper).intValue());

        }
        //TODO:stream流相加方法
        Integer totalCount = totalOrderList.stream().reduce(Integer::sum).get();
        Integer validCount = validOrderList.stream().reduce(Integer::sum).get();


        Double orderCompletionRate=0.0;
        if(totalCount!=0){orderCompletionRate= validCount.doubleValue()/totalCount; }

        return OrderReportVO.builder()
                .dateList(StringUtils.join(dateList,","))
                .orderCountList(StringUtils.join(totalOrderList,","))
                .validOrderCountList(StringUtils.join(validOrderList,","))
                .totalOrderCount(totalCount)
                .validOrderCount(validCount)
                .orderCompletionRate(orderCompletionRate)
                .build();
    }

    /**
     * 売上ランキングtop 10 料理名と販売数
     * @param begin
     * @param end
     * @return
     */
    @Override
    public SalesTop10ReportVO getSalesTop10Statistics(LocalDate begin, LocalDate end) {
        //completed order + order_detail number
        /*select od.name,sum(od.number) num from order_detail od ,orders o
        where od.order_id=o.id
         and o.status=Orders.COMPLETED
         and o.order_time <? >?
         and o.is_deleted!=0
        group by od.name
        order by num desc limit 0,10
         */
        LocalDateTime beginTime=LocalDateTime.of(begin, LocalTime.MIN);
        LocalDateTime endTime=LocalDateTime.of(end, LocalTime.MAX);
        List<GoodsSalesDTO> salesTop10 = ordersMapper.getSalesTop10(beginTime, endTime);

        List<String> names = salesTop10.stream().map(GoodsSalesDTO::getName).collect(Collectors.toList());
        List<Integer> sales=salesTop10.stream().map(GoodsSalesDTO::getNumber).collect(Collectors.toList());

        return SalesTop10ReportVO.builder()
                .nameList(StringUtils.join(names,","))
                .numberList(StringUtils.join(sales,","))
                .build();
    }
}
