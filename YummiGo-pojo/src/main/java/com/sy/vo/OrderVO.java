package com.sy.vo;

import com.sy.entity.OrderDetail;
import com.sy.entity.Orders;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderVO extends Orders implements Serializable {

    // 注文商品情報
    private String orderDishes;

    // 注文詳細情報
    private List<OrderDetail> orderDetailList;

}
