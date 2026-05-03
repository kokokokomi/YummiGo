package com.sy.task;

import com.stripe.service.climate.OrderService;
import com.sy.entity.Orders;
import com.sy.mapper.OrdersMapper;
import com.sy.service.OrdersService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/*
  Spring task 定時にオーダー状態を処理する
 */

@Component
@Slf4j

public class OrderTask {

    @Autowired
    private OrdersService ordersService;
    /**
     * ユーザー注文した後、十五分支払わなっかたら、自動的にキャンセルします
     */
    @Scheduled(cron = "0 * * * * ? ")//毎分に触発する
//    @Scheduled(cron="1/5 * * * * ?")

    public void proccessTimeoutOrder(){
        log.info("over time order process:{}", LocalDateTime.now());
        // status=? order_time<(now-15)
        LocalDateTime now = LocalDateTime.now().plusMinutes(-15);
        List<Orders> ordersList = ordersService.getByStatusAndOrderTimeLT(Orders.PENDING_PAYMENT, now);

        if(ordersList.size() > 0 && ordersList!=null){
            for(Orders orders : ordersList){
                orders.setStatus(Orders.CANCELLED);
                orders.setCancelReason("時間切れによる注文の自動キャンセル");
                orders.setCancelTime(LocalDateTime.now());

                ordersService.updateById(orders);
            }
        }

    }

    /**
     * ずっと配送中のオーダーを処理する
     */
    @Scheduled(cron = "0 0 1 * * ?")
//    @Scheduled(cron="0/5 * * * * ?")
    public void proccessDeliveryOrder(){
        log.info("over time delivery order process:{}", LocalDateTime.now());
        LocalDateTime time = LocalDateTime.now().plusMinutes(-60);
        List<Orders> ordersList=ordersService.getByStatusAndOrderTimeLT(Orders.DELIVERY_IN_PROGRESS,time);
        if(ordersList.size() > 0 && ordersList!=null){
            for(Orders orders : ordersList){
                orders.setStatus(Orders.COMPLETED);

                ordersService.updateById(orders);
            }
        }

    }
}
