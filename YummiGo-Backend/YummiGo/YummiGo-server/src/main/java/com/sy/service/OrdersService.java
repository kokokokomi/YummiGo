package com.sy.service;

import com.sy.dto.OrdersPageQueryDTO;
import com.sy.dto.OrdersPaymentDTO;
import com.sy.dto.OrdersCancelDTO;
import com.sy.dto.OrdersConfirmDTO;
import com.sy.dto.OrdersRejectionDTO;
import com.sy.dto.OrdersSubmitDTO;
import com.sy.entity.Orders;
import com.baomidou.mybatisplus.extension.service.IService;
import com.sy.result.PageResult;
import com.sy.vo.OrderPaymentStatusVO;
import com.sy.vo.OrderPaymentVO;
import com.sy.vo.OrderStatisticsVO;
import com.sy.vo.OrderSubmitVO;
import com.sy.vo.OrderVO;

import java.time.LocalDateTime;
import java.util.List;


/**
* @author kokomi
* @description 针对表【orders(注文表)】的数据库操作Service
* @createDate 2025-08-15 18:03:00
*/
public interface OrdersService extends IService<Orders> {

    //User order placement ユーザー注文
    OrderSubmitVO submitOrder(OrdersSubmitDTO ordersSubmitDTO);

    //
    OrderPaymentVO createPaymentSession(OrdersPaymentDTO ordersPaymentDTO);

    //
    void handleWebhook(String payload, String sigHeader);

    OrderPaymentStatusVO getPaymentStatus(Long orderId);

    /**
     * 用户从 Stripe Checkout 成功页带回 session_id 后调用：向 Stripe 校验支付状态并幂等更新订单。
     * （与 webhook 二选一或并存均可，建议两者都做以便本地未配 webhook 时也能关单。）
     */
    OrderPaymentStatusVO confirmCheckoutSession(String sessionId);

    /**
     * Paginated order list.
     *
     * @param ordersPageQueryDTO query filters
     * @param scopedUserId       if non-null, only orders for this user (C端); if null, no user constraint from login id (商家端，可按 DTO 的 userId 筛选)
     */
    PageResult orderPageQuery(OrdersPageQueryDTO ordersPageQueryDTO, Long scopedUserId);

    /**
     * @param scopedUserId C 端传当前用户 ID，仅允许查看本人订单；商家端传 null
     */
    OrderVO getOrderById(Long id, Long scopedUserId);

    /** 商家端：待处理(待接单)、待派送、派送中订单数量 */
    OrderStatisticsVO orderStatistics();

    /** 商家端：接单 */
    void confirm(OrdersConfirmDTO ordersConfirmDTO);

    /** 商家端：拒单 */
    void reject(OrdersRejectionDTO ordersRejectionDTO);

    /** 商家端：取消订单 */
    void cancel(OrdersCancelDTO ordersCancelDTO);

    /** 商家端：派送 */
    void delivery(Long id);

    /** 商家端：完成订单 */
    void complete(Long id);

    /** 用户端：取消订单（仅允许取消自己的未完成订单） */
    void userCancelOrder(Long orderId, Long userId, String reason);

    /**
     *
     */
    List<Orders> getByStatusAndOrderTimeLT(Integer status, LocalDateTime orderTime);
}
