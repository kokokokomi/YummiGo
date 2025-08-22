package com.sy.controller.user;

import com.sy.dto.OrdersSubmitDTO;
import com.sy.result.Result;
import com.sy.service.OrderDetailService;
import com.sy.service.OrdersService;
import com.sy.vo.OrderSubmitVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController("userOrderController")
@RequestMapping("user/order")
@Slf4j
@Tag(name = "C-Order-API")
public class OrderController {
    @Autowired
    private OrdersService ordersService;

    /**
     * User order placement ユーザー注文
     * @param ordersSubmitDTO
     * @return
     */
    @PostMapping("submit")
    @Operation(summary = "Submit order")
    public Result<OrderSubmitVO> submitOrder(@RequestBody OrdersSubmitDTO ordersSubmitDTO) {
        log.info("user submit order:{}", ordersSubmitDTO);
        OrderSubmitVO orderSubmitVO = ordersService.submitOrder(ordersSubmitDTO);
        return Result.success(orderSubmitVO);
    }


}
