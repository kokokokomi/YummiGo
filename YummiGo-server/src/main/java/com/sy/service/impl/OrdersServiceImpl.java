package com.sy.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.sy.constant.MessageConstant;
import com.sy.context.BaseContext;
import com.sy.dto.OrdersSubmitDTO;
import com.sy.entity.AddressBook;
import com.sy.entity.OrderDetail;
import com.sy.entity.Orders;
import com.sy.entity.ShoppingCart;
import com.sy.exception.AddressBookBusinessException;
import com.sy.mapper.AddressBookMapper;
import com.sy.mapper.OrderDetailMapper;
import com.sy.mapper.ShoppingCartMapper;
import com.sy.service.OrdersService;
import com.sy.mapper.OrdersMapper;
import com.sy.vo.OrderSubmitVO;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
* @author kokomi
* @description 针对表【orders(注文表)】的数据库操作Service实现
* @createDate 2025-08-15 18:03:00
*/
@Service
public class OrdersServiceImpl extends ServiceImpl<OrdersMapper, Orders>
    implements OrdersService{
    @Autowired
    private OrdersMapper ordersMapper;
    @Autowired
    private AddressBookMapper addressBookMapper;
    @Autowired
    private ShoppingCartMapper shoppingCartMapper;
    @Autowired
    private OrderDetailMapper orderDetailMapper;


    /**
     * User order placement ユーザー注文
     * @param ordersSubmitDTO
     * @return
     */
    @Override
    @Transactional
    public OrderSubmitVO submitOrder(OrdersSubmitDTO ordersSubmitDTO) {
        AddressBook addressBook = addressBookMapper.selectById(ordersSubmitDTO.getAddressBookId());

        //handle exception
        if(addressBook == null){
            throw new AddressBookBusinessException(MessageConstant.ADDRESS_BOOK_IS_NULL);
        }
        Long currentId = BaseContext.getCurrentId();
        List<ShoppingCart> list = shoppingCartMapper.selectList(
                new LambdaQueryWrapper<ShoppingCart>()
                        .eq(ShoppingCart::getUserId, currentId)
        );
        if(list == null || list.size() == 0){
            throw new AddressBookBusinessException(MessageConstant.SHOPPING_CART_IS_NULL);
        }

        //create order data
        Orders order = new Orders();
        BeanUtils.copyProperties(ordersSubmitDTO, order);
        order.setAddressBookId(addressBook.getId());
        order.setUserId(BaseContext.getCurrentId());
        order.setPayStatus(Orders.UN_PAID);
        order.setStatus(Orders.PENDING_PAYMENT);
        order.setSnapshotPhone(addressBook.getPhone());
        order.setSnapshotAddress(addressBook.getDetail());
        order.setSnapshotConsignee(addressBook.getConsignee());
        order.setNumber(String.valueOf(System.currentTimeMillis()));

        //insert an order
        ordersMapper.insert(order);

        List<OrderDetail> orderDetailList=new ArrayList<>();
        for(ShoppingCart cart : list){
            OrderDetail orderDetail = new OrderDetail();
            BeanUtils.copyProperties(cart, orderDetail);
            orderDetail.setOrderId(order.getId());
            orderDetailList.add(orderDetail);
        }

        orderDetailMapper.insert(orderDetailList);

        shoppingCartMapper.delete(new LambdaQueryWrapper<ShoppingCart>()
                .eq(ShoppingCart::getUserId, order.getUserId()));

        OrderSubmitVO orderSubmitVO = OrderSubmitVO.builder()
                .id(order.getId())
                .orderNumber(order.getNumber())
                .orderAmount(order.getAmount())
                .orderTime(order.getOrderTime())
                .build();
        return orderSubmitVO;

    }
}




