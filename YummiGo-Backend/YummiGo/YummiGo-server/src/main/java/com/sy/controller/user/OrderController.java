package com.sy.controller.user;

import com.sy.context.BaseContext;
import com.sy.dto.OrdersPageQueryDTO;
import com.sy.dto.OrdersCancelDTO;
import com.sy.dto.OrdersPaymentDTO;
import com.sy.dto.OrdersSubmitDTO;
import com.sy.entity.Orders;
import com.sy.result.PageResult;
import com.sy.result.Result;
import com.sy.service.OrderDetailService;
import com.sy.service.OrdersService;
import com.sy.vo.OrderPaymentStatusVO;
import com.sy.vo.OrderPaymentVO;
import com.sy.vo.OrderSubmitVO;
import com.sy.vo.OrderVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

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
        System.out.println("orderSubmitVO:" + orderSubmitVO);
        return Result.success(orderSubmitVO);
    }

    @PostMapping("payment")
    @Operation(summary = "Pay Order")
    public Result<OrderPaymentVO> payOrder(@RequestBody OrdersPaymentDTO ordersPaymentDTO) {
        log.info("user pay order:{}", ordersPaymentDTO);
        try {
            OrderPaymentVO result = ordersService.createPaymentSession(ordersPaymentDTO);
            return Result.success(result);
        } catch (Exception e) {
            log.error("error session create", e);
            return Result.error("Try again later");
        }
    }

    /**
     * get payment status
     * @param orderId
     * @return
     */
    @GetMapping("status/{orderId}")
    public Result<OrderPaymentStatusVO> getPaymentStatus(@PathVariable Long orderId) {
        try {
            OrderPaymentStatusVO result = ordersService.getPaymentStatus(orderId);
            return Result.success(result);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 从 Stripe Checkout 成功页回到前端后，用 URL 中的 session_id 调用本接口，校验 Stripe 并幂等更新订单状态。
     * （与 Webhook 配合：线上以 Webhook 为准，本接口保证用户立刻看到已支付。）
     */
    @GetMapping("payment/complete")
    @Operation(summary = "Confirm Stripe Checkout session after redirect")
    public Result<OrderPaymentStatusVO> confirmPaymentAfterStripe(@RequestParam("session_id") String sessionId) {
        OrderPaymentStatusVO vo = ordersService.confirmCheckoutSession(sessionId);
        return Result.success(vo);
    }

    /**
     *
     * @param ordersPageQueryDTO
     * @return
     */
    @GetMapping("page")
    public Result<PageResult> orderPageQuery(@ParameterObject  OrdersPageQueryDTO ordersPageQueryDTO) {
        log.info("order page query"+ordersPageQueryDTO);
        PageResult result = ordersService.orderPageQuery(ordersPageQueryDTO, BaseContext.getCurrentId());
        return Result.success(result);
    }

    /**
     * Get Order detail by order id
     * @param id
     * @return
     */
    @GetMapping("/{id:\\d+}")
    public Result<OrderVO> getOrderById(@PathVariable Long id) {
        log.info("user getOrderById:{}", id);
        OrderVO result = ordersService.getOrderById(id, BaseContext.getCurrentId());
        return Result.success(result);
    }

    @PutMapping("cancel/{id}")
    @Operation(summary = "User cancel order")
    public Result<String> userCancel(@PathVariable Long id, @RequestBody(required = false) OrdersCancelDTO dto) {
        String reason = dto == null ? "用户取消" : dto.getCancelReason();
        ordersService.userCancelOrder(id, BaseContext.getCurrentId(), reason);
        return Result.success();
    }


}
