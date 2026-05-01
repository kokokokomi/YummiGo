package com.sy.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.net.Webhook;
import com.sy.constant.MessageConstant;
import com.sy.context.BaseContext;
import com.sy.dto.OrdersCancelDTO;
import com.sy.dto.OrdersConfirmDTO;
import com.sy.dto.OrdersPageQueryDTO;
import com.sy.dto.OrdersPaymentDTO;
import com.sy.dto.OrdersRejectionDTO;
import com.sy.dto.OrdersSubmitDTO;
import com.sy.entity.AddressBook;
import com.sy.entity.OrderDetail;
import com.sy.entity.Orders;
import com.sy.entity.ShoppingCart;
import com.sy.exception.AddressBookBusinessException;
import com.sy.exception.OrderBusinessException;
import com.sy.exception.PaymentException;
import com.sy.mapper.AddressBookMapper;
import com.sy.mapper.OrderDetailMapper;
import com.sy.mapper.ShoppingCartMapper;
import com.sy.result.PageResult;
import com.sy.service.OrdersService;
import com.sy.mapper.OrdersMapper;
import com.sy.vo.OrderPaymentStatusVO;
import com.sy.vo.OrderPaymentVO;
import com.sy.vo.OrderStatisticsVO;
import com.sy.vo.OrderSubmitVO;
import com.sy.vo.OrderVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.annotation.PostConstruct;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import com.stripe.Stripe;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.PaymentIntent;
import com.google.gson.JsonSyntaxException;

/**
* @author kokomi
* @description 针对表【orders(注文表)】的数据库操作Service实现
* @createDate 2025-08-15 18:03:00
*/
@Service
@Slf4j
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

    @Value("${sy.stripe.apiKey}")
    private String stripeSecretKey;

    @Value("${sy.stripe.webhookSecret:}")
    private String stripeWebhookSecret;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeSecretKey;
    }


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
        order.setOrderTime(LocalDateTime.now());
//        System.out.println("不是惊魂甫定");

        //insert an order
        ordersMapper.insert(order);

        List<OrderDetail> orderDetailList=new ArrayList<>();
        for(ShoppingCart cart : list){
            OrderDetail orderDetail = new OrderDetail();
            BeanUtils.copyProperties(cart, orderDetail);
            orderDetail.setOrderId(order.getId());
            orderDetailList.add(orderDetail);
        }
//        System.out.println("v回复大家");

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

    @Override
    public OrderPaymentVO createPaymentSession(OrdersPaymentDTO ordersPaymentDTO) {
        try {
            // 1. check order
            Orders order = ordersMapper.selectById(ordersPaymentDTO.getOrderId());
            if (order == null) {
                throw new OrderBusinessException("Order Not Found");
            }
            if (!Objects.equals(order.getUserId(), BaseContext.getCurrentId())) {
                throw new OrderBusinessException("Order Not Found");
            }

            if (!Objects.equals(order.getPayStatus(), Orders.UN_PAID)) {
                throw new OrderBusinessException("订单已支付或状态异常");
            }

            if (order.getAmount() == null) {
                throw new OrderBusinessException("订单金额异常");
            }

            // 验证金额是否匹配（与 Stripe line item 一致，单位：分）
            if (order.getAmount().multiply(new BigDecimal(100)).longValue() != ordersPaymentDTO.getAmountInCents()) {
                throw new OrderBusinessException("支付金额与订单金额不匹配");
            }

            String currency = ordersPaymentDTO.getCurrency() != null && !ordersPaymentDTO.getCurrency().isBlank()
                    ? ordersPaymentDTO.getCurrency().toLowerCase()
                    : "jpy";

            SessionCreateParams.LineItem.PriceData.ProductData.Builder productData =
                    SessionCreateParams.LineItem.PriceData.ProductData.builder()
                            .setName("订单支付 - " + order.getNumber());
            if (order.getSummary() != null) {
                productData.setDescription(order.getSummary());
            }
            String cover = order.getFirstItemImage();
            if (cover != null && !cover.isBlank() && (cover.startsWith("http://") || cover.startsWith("https://"))) {
                productData.addImage(cover);
            }

            SessionCreateParams.Builder sessionBuilder = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setSuccessUrl(appendStripeSessionPlaceholder(ordersPaymentDTO.getSuccessUrl()))
                    .setCancelUrl(ordersPaymentDTO.getCancelUrl())
                    .addLineItem(
                            SessionCreateParams.LineItem.builder()
                                    .setQuantity(1L)
                                    .setPriceData(
                                            SessionCreateParams.LineItem.PriceData.builder()
                                                    .setCurrency(currency)
                                                    .setUnitAmount(ordersPaymentDTO.getAmountInCents())
                                                    .setProductData(productData.build())
                                                    .build()
                                    )
                                    .build()
                    )
                    .putMetadata("orderId", order.getId().toString())
                    .putMetadata("orderNumber", order.getNumber())
                    .putMetadata("userId", order.getUserId().toString())
                    .putMetadata("payMethod", String.valueOf(ordersPaymentDTO.getPayMethod()))
                    .addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD)
                    .setPaymentIntentData(
                            SessionCreateParams.PaymentIntentData.builder()
                                    .putMetadata("orderId", order.getId().toString())
                                    .setDescription("订单支付: " + order.getNumber())
                                    .build()
                    );

            if (ordersPaymentDTO.getCustomerEmail() != null && !ordersPaymentDTO.getCustomerEmail().isBlank()) {
                sessionBuilder.setCustomerEmail(ordersPaymentDTO.getCustomerEmail());
            }

            Session session = Session.create(sessionBuilder.build());

            // 3. 更新订单上的 Checkout Session（带乐观锁版本号）
            Orders persisted = ordersMapper.selectById(order.getId());
            persisted.setStripeSessionId(session.getId());
            persisted.setPayMethod(ordersPaymentDTO.getPayMethod());
            ordersMapper.updateById(persisted);

            Integer waitingOrders = ordersMapper.countByStatus(Orders.TO_BE_CONFIRMED);

            OrderPaymentVO result = new OrderPaymentVO();
            result.setOrderId(order.getId());
            result.setSessionId(session.getId());
            result.setCheckoutUrl(session.getUrl());
            result.setWaitingOrders(waitingOrders);

            log.info("创建支付会话成功，订单ID: {}, Session ID: {}", order.getId(), session.getId());

            return result;

        }
        catch (OrderBusinessException e) {
            log.error("业务异常: {}", e.getMessage());
            throw e;
        }catch (StripeException e) {
            log.error("Stripe API异常: {}", e.getMessage(), e);
            throw new PaymentException("支付服务异常，请稍后重试");
        } catch (Exception e) {
            log.error("创建支付会话未知异常: {}", e.getMessage(), e);
            throw new PaymentException("系统异常，请稍后重试");
        }
    }

    @Override
    public void handleWebhook(String payload, String sigHeader) {
        if (stripeWebhookSecret == null || stripeWebhookSecret.isBlank()) {
            log.error("未配置 sy.stripe.webhookSecret，拒绝处理 Webhook（请在 application 中配置签名密钥）");
            throw new PaymentException("webhook not configured");
        }

        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, stripeWebhookSecret);
        } catch (JsonSyntaxException e) {
            log.error("Invalid payload", e);
            throw new PaymentException("Invalid payload");
        } catch (SignatureVerificationException e) {
            log.error("Invalid signature", e);
            throw new PaymentException("Invalid signature");
        }

        switch (event.getType()) {
            case "payment_intent.succeeded":
                PaymentIntent intent = (PaymentIntent) event.getData().getObject();
                log.info("payment_intent.succeeded: {}", intent.getId());
                break;
            case "checkout.session.completed":
                Session session = (Session) event.getData().getObject();
                log.info("checkout.session.completed: {}", session.getId());
                handlePaymentSuccess(session.getId());
                break;
            case "checkout.session.async_payment_succeeded":
                Session asyncSession = (Session) event.getData().getObject();
                log.info("checkout.session.async_payment_succeeded: {}", asyncSession.getId());
                handlePaymentSuccess(asyncSession.getId());
                break;
            case "payment_intent.payment_failed":
                log.warn("payment_intent.payment_failed: {}", event.getId());
                break;

            default:
                log.debug("未处理的 Stripe 事件类型: {}", event.getType());
        }
    }

    @Override
    public OrderPaymentStatusVO getPaymentStatus(Long orderId) {
        Orders order = ordersMapper.selectById(orderId);
        if (order == null || Objects.equals(order.getIsDeleted(), 1)) {
            throw new OrderBusinessException(MessageConstant.ORDER_NOT_FOUND);
        }
        if (!Objects.equals(order.getUserId(), BaseContext.getCurrentId())) {
            throw new OrderBusinessException(MessageConstant.ORDER_NOT_FOUND);
        }

        OrderPaymentStatusVO result = new OrderPaymentStatusVO();
        result.setOrderId(orderId);
        result.setOrderNumber(order.getNumber());
        result.setPayStatus(order.getPayStatus());
        result.setStatus(order.getStatus());
        result.setAmount(order.getAmount());
        result.setCheckoutTime(order.getCheckoutTime());
        return result;
    }

    @Override
    public OrderPaymentStatusVO confirmCheckoutSession(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            throw new OrderBusinessException("session_id 无效");
        }
        try {
            Session session = Session.retrieve(sessionId);
            if (!"paid".equalsIgnoreCase(session.getPaymentStatus())) {
                throw new OrderBusinessException("支付尚未完成，请稍后刷新");
            }
            String orderIdStr = session.getMetadata() != null ? session.getMetadata().get("orderId") : null;
            if (orderIdStr == null) {
                throw new OrderBusinessException("支付会话缺少订单信息");
            }
            Orders order = ordersMapper.selectById(Long.parseLong(orderIdStr));
            if (order == null || Objects.equals(order.getIsDeleted(), 1)) {
                throw new OrderBusinessException(MessageConstant.ORDER_NOT_FOUND);
            }
            if (!Objects.equals(order.getUserId(), BaseContext.getCurrentId())) {
                throw new OrderBusinessException(MessageConstant.ORDER_NOT_FOUND);
            }
            handlePaymentSuccess(sessionId);
            return getPaymentStatus(order.getId());
        } catch (StripeException e) {
            log.error("Stripe 校验 session 失败: {}", e.getMessage(), e);
            throw new PaymentException("支付校验失败，请稍后重试");
        }
    }

    /**
     * page query orders
     * @param dto
     * @return
     */
    @Override
    public PageResult orderPageQuery(OrdersPageQueryDTO dto, Long scopedUserId) {
        if (scopedUserId != null) {
            dto.setUserId(scopedUserId);
        }
        int pageNo = dto.getPage() <= 0 ? 1 : dto.getPage();
        int size = dto.getPageSize() <= 0 ? 10 : dto.getPageSize();
        Page<OrderVO> page = new Page<>(pageNo, size);
        // 避免 MP 对含动态 WHERE / o.* 的 XML 做 count 优化时解析出错（如生成 WHERE ) TOTAL）
        page.setOptimizeCountSql(false);
        List<OrderVO> records = ordersMapper.selectOrderVOPage(page, dto);
        page.setRecords(records);
        for (OrderVO vo : records) {
            if (vo.getOrderDishes() == null && vo.getSummary() != null) {
                vo.setOrderDishes(vo.getSummary());
            }
        }
        return new PageResult(page.getTotal(), page.getRecords());
    }

    @Override
    public OrderVO getOrderById(Long id, Long scopedUserId) {
        Orders order = ordersMapper.selectById(id);
        if (order == null || Objects.equals(order.getIsDeleted(), 1)) {
            throw new OrderBusinessException(MessageConstant.ORDER_NOT_FOUND);
        }
        if (scopedUserId != null && !Objects.equals(scopedUserId, order.getUserId())) {
            throw new OrderBusinessException(MessageConstant.ORDER_NOT_FOUND);
        }
        List<OrderDetail> orderDetailList = orderDetailMapper.selectList(
                new LambdaQueryWrapper<OrderDetail>()
                        .eq(OrderDetail::getOrderId, id)
                        .and(w -> w.isNull(OrderDetail::getIsDeleted).or().eq(OrderDetail::getIsDeleted, 0))
        );
        OrderVO orderVO = new OrderVO();
        BeanUtils.copyProperties(order, orderVO);
        orderVO.setOrderDetailList(orderDetailList);
        if (order.getSummary() != null) {
            orderVO.setOrderDishes(order.getSummary());
        } else if (!orderDetailList.isEmpty()) {
            StringBuilder sb = new StringBuilder();
            for (OrderDetail d : orderDetailList) {
                if (!sb.isEmpty()) {
                    sb.append("；");
                }
                sb.append(d.getName()).append(" x").append(d.getNumber());
            }
            orderVO.setOrderDishes(sb.toString());
        }
        return orderVO;
    }

    @Override
    public OrderStatisticsVO orderStatistics() {
        OrderStatisticsVO vo = ordersMapper.selectOrderStatistics();
        if (vo == null) {
            OrderStatisticsVO empty = new OrderStatisticsVO();
            empty.setToBeConfirmed(0);
            empty.setConfirmed(0);
            empty.setDeliveryInProgress(0);
            return empty;
        }
        return vo;
    }

    @Override
    @Transactional
    public void confirm(OrdersConfirmDTO ordersConfirmDTO) {
        Orders order = loadOrderOrThrow(ordersConfirmDTO.getId());
        if (!Objects.equals(order.getStatus(), Orders.TO_BE_CONFIRMED)) {
            throw new OrderBusinessException("当前订单状态不支持接单");
        }
        order.setStatus(Orders.CONFIRMED);
        if (order.getEstimatedDeliveryTime() == null) {
            order.setEstimatedDeliveryTime(LocalDateTime.now().plusMinutes(30));
        }
        ordersMapper.updateById(order);
    }

    @Override
    @Transactional
    public void reject(OrdersRejectionDTO ordersRejectionDTO) {
        Orders order = loadOrderOrThrow(ordersRejectionDTO.getId());
        if (!Objects.equals(order.getStatus(), Orders.TO_BE_CONFIRMED)) {
            throw new OrderBusinessException("当前订单状态不支持拒单");
        }
        order.setStatus(Orders.CANCELLED);
        order.setRejectionReason(ordersRejectionDTO.getRejectionReason());
        order.setCancelReason(ordersRejectionDTO.getRejectionReason());
        order.setCancelTime(LocalDateTime.now());
        if (Objects.equals(order.getPayStatus(), Orders.PAID)) {
            order.setPayStatus(Orders.REFUND);
        }
        ordersMapper.updateById(order);
    }

    @Override
    @Transactional
    public void cancel(OrdersCancelDTO ordersCancelDTO) {
        Orders order = loadOrderOrThrow(ordersCancelDTO.getId());
        // 商家端取消：待付款/待接单/待派送/派送中 都允许取消
        if (!(Objects.equals(order.getStatus(), Orders.PENDING_PAYMENT)
                || Objects.equals(order.getStatus(), Orders.TO_BE_CONFIRMED)
                || Objects.equals(order.getStatus(), Orders.CONFIRMED)
                || Objects.equals(order.getStatus(), Orders.DELIVERY_IN_PROGRESS))) {
            throw new OrderBusinessException("当前订单状态不支持取消");
        }
        order.setStatus(Orders.CANCELLED);
        order.setCancelReason(ordersCancelDTO.getCancelReason());
        order.setCancelTime(LocalDateTime.now());
        if (Objects.equals(order.getPayStatus(), Orders.PAID)) {
            order.setPayStatus(Orders.REFUND);
        }
        ordersMapper.updateById(order);
    }

    @Override
    @Transactional
    public void delivery(Long id) {
        Orders order = loadOrderOrThrow(id);
        if (!Objects.equals(order.getStatus(), Orders.CONFIRMED)) {
            throw new OrderBusinessException("当前订单状态不支持派送");
        }
        order.setStatus(Orders.DELIVERY_IN_PROGRESS);
        ordersMapper.updateById(order);
    }

    @Override
    @Transactional
    public void complete(Long id) {
        Orders order = loadOrderOrThrow(id);
        if (!Objects.equals(order.getStatus(), Orders.DELIVERY_IN_PROGRESS)) {
            throw new OrderBusinessException("当前订单状态不支持完成");
        }
        order.setStatus(Orders.COMPLETED);
        order.setDeliveryTime(LocalDateTime.now());
        ordersMapper.updateById(order);
    }

    @Override
    @Transactional
    public void userCancelOrder(Long orderId, Long userId, String reason) {
        Orders order = loadOrderOrThrow(orderId);
        if (!Objects.equals(order.getUserId(), userId)) {
            throw new OrderBusinessException(MessageConstant.ORDER_NOT_FOUND);
        }
        if (!(Objects.equals(order.getStatus(), Orders.PENDING_PAYMENT)
                || Objects.equals(order.getStatus(), Orders.TO_BE_CONFIRMED))) {
            throw new OrderBusinessException("当前订单状态不可取消");
        }
        order.setStatus(Orders.CANCELLED);
        order.setCancelReason((reason == null || reason.isBlank()) ? "用户取消" : reason);
        order.setCancelTime(LocalDateTime.now());
        if (Objects.equals(order.getPayStatus(), Orders.PAID)) {
            order.setPayStatus(Orders.REFUND);
        }
        ordersMapper.updateById(order);
    }

    /**
     * 状態とオーダー時間によってオーダーリストを得る
     * @param status
     * @param orderTime
     * @return
     */
    @Override
    public List<Orders> getByStatusAndOrderTimeLT(Integer status, LocalDateTime orderTime) {
        return this.list(
                new LambdaQueryWrapper<Orders>()
                        .eq(Orders::getStatus, status)
                        .lt(Orders::getOrderTime, orderTime)
        );
    }

    private Orders loadOrderOrThrow(Long id) {
        Orders order = ordersMapper.selectById(id);
        if (order == null || Objects.equals(order.getIsDeleted(), 1)) {
            throw new OrderBusinessException(MessageConstant.ORDER_NOT_FOUND);
        }
        return order;
    }

    /**
     * Stripe Checkout 支付成功后的落库（Webhook 与 confirm 接口共用，需幂等）。
     */
    private void handlePaymentSuccess(String sessionId) {
        try {
            Session session = Session.retrieve(sessionId);
            String orderIdStr = session.getMetadata() != null ? session.getMetadata().get("orderId") : null;

            if (orderIdStr == null) {
                log.error("支付会话元数据中未找到订单ID, Session ID: {}", sessionId);
                throw new PaymentException("会话缺少 orderId 元数据");
            }

            Orders order = ordersMapper.selectById(Long.parseLong(orderIdStr));
            if (order == null) {
                log.error("未找到订单，订单ID: {}", orderIdStr);
                throw new PaymentException("订单不存在");
            }
            if (Objects.equals(order.getPayStatus(), Orders.PAID)) {
                log.info("订单已标记为已支付，忽略重复回调 orderId={}", order.getId());
                return;
            }

            order.setPayStatus(Orders.PAID);
            order.setStatus(Orders.TO_BE_CONFIRMED);
            order.setCheckoutTime(LocalDateTime.now());
            if (session.getPaymentIntent() != null) {
                order.setStripePaymentIntentId(session.getPaymentIntent());
            }
            int rows = ordersMapper.updateById(order);
            if (rows <= 0) {
                log.error("更新订单支付状态失败（可能乐观锁冲突），订单ID: {}", orderIdStr);
                throw new PaymentException("订单状态更新失败，请重试");
            }
            log.info("订单支付成功，订单ID: {}, Session ID: {}", orderIdStr, sessionId);
        } catch (StripeException e) {
            log.error("Stripe 查询 Session 失败: {}", e.getMessage(), e);
            throw new PaymentException("支付服务暂不可用");
        }
    }

    /**
     * successUrl 需为「不含 session_id」的地址；Stripe 会自动追加 session_id={CHECKOUT_SESSION_ID}
     */
    private static String appendStripeSessionPlaceholder(String successUrl) {
        if (successUrl == null || successUrl.isBlank()) {
            throw new OrderBusinessException("successUrl 不能为空");
        }
        String sep = successUrl.contains("?") ? "&" : "?";
        return successUrl + sep + "session_id={CHECKOUT_SESSION_ID}";
    }
}




