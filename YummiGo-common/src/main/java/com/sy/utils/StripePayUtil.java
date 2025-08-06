package com.sy.utils;

import com.alibaba.fastjson2.JSONObject;
import com.sy.properties.StripeProperties;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Refund;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.RefundCreateParams;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Map;

/**
 * Stripe 支付工具类（多模块支持版本）
 * 提供创建支付意图、确认支付、申请退款等功能
 */
@Component
@Slf4j
@ConditionalOnClass(name = "com.stripe.Stripe")
public class StripePayUtil {

    @Autowired
    private StripeProperties stripeProperties;

    /**
     * 构造函数注入（推荐方式）
     */
    public StripePayUtil(StripeProperties stripeProperties) {
        this.stripeProperties = stripeProperties;
    }

    /**
     * Setter 注入（备用方式）
     */
    @Autowired(required = false)
    public void setStripeProperties(StripeProperties stripeProperties) {
        this.stripeProperties = stripeProperties;
    }

    /**
     * 初始化 Stripe API Key
     */
    @PostConstruct
    public void init() {
        if (stripeProperties == null) {
            log.warn("StripeProperties not configured, Stripe functionality will be disabled");
            return;
        }

        if (!stripeProperties.isValid()) {
            log.error("Invalid Stripe configuration: {}", stripeProperties.getConfigSummary());
            throw new IllegalStateException("Stripe configuration is invalid. Please check your application.yml");
        }

        Stripe.apiKey = stripeProperties.getSecretKey();
        log.info("Stripe API initialized successfully - {}", stripeProperties.getConfigSummary());
    }

    /**
     * 检查配置是否可用
     */
    private void checkConfiguration() {
        if (stripeProperties == null || !stripeProperties.isValid()) {
            throw new IllegalStateException("Stripe is not properly configured");
        }
    }

    /**
     * 创建支付意图 (类似微信的 jsapi 下单)
     *
     * @param orderNum    商户订单号
     * @param total       总金额 (单位：元)
     * @param description 商品描述
     * @param customerEmail 客户邮箱 (可选)
     * @return PaymentIntent 对象
     * @throws StripeException Stripe 异常
     */
    public PaymentIntent createPaymentIntent(String orderNum, BigDecimal total, String description, String customerEmail) throws StripeException {
        checkConfiguration();

        try {
            // 将金额转换为分 (Stripe 使用最小货币单位)
            Long amount = total.multiply(new BigDecimal("100"))
                    .setScale(0, RoundingMode.HALF_UP)
                    .longValue();

            // 创建支付意图参数
            PaymentIntentCreateParams.Builder paramsBuilder = PaymentIntentCreateParams.builder()
                    .setAmount(amount)
                    .setCurrency(stripeProperties.getCurrency())
                    .setDescription(description)
                    .putMetadata("order_number", orderNum)
                    .setConfirmationMethod(PaymentIntentCreateParams.ConfirmationMethod.MANUAL)
                    .setConfirm(false);

            // 如果有客户邮箱，添加收据邮箱
            if (customerEmail != null && !customerEmail.trim().isEmpty()) {
                paramsBuilder.setReceiptEmail(customerEmail);
            }

            // 设置自动支付方法
            paramsBuilder.setAutomaticPaymentMethods(
                    PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                            .setEnabled(true)
                            .build()
            );

            PaymentIntent paymentIntent = PaymentIntent.create(paramsBuilder.build());
            log.info("Created PaymentIntent: {}", paymentIntent.getId());

            return paymentIntent;
        } catch (StripeException e) {
            log.error("Error creating PaymentIntent for order: {}", orderNum, e);
            throw e;
        }
    }

    /**
     * 创建支付 (类似微信支付的 pay 方法)
     *
     * @param orderNum    商户订单号
     * @param total       金额，单位 元
     * @param description 商品描述
     * @param customerEmail 客户邮箱
     * @return JSON 对象，包含客户端所需的支付信息
     */
    public JSONObject pay(String orderNum, BigDecimal total, String description, String customerEmail) throws Exception {
        checkConfiguration();

        try {
            PaymentIntent paymentIntent = createPaymentIntent(orderNum, total, description, customerEmail);

            // 构造返回给前端的数据
            JSONObject result = new JSONObject();
            result.put("client_secret", paymentIntent.getClientSecret());
            result.put("payment_intent_id", paymentIntent.getId());
            result.put("amount", paymentIntent.getAmount());
            result.put("currency", paymentIntent.getCurrency());
            result.put("status", paymentIntent.getStatus());
            result.put("publishable_key", stripeProperties.getPublishableKey());

            // 添加元数据
            Map<String, String> metadata = new HashMap<>();
            metadata.put("order_number", orderNum);
            metadata.put("description", description);
            result.put("metadata", metadata);

            log.info("Payment created successfully for order: {}", orderNum);
            return result;

        } catch (StripeException e) {
            log.error("Error creating payment for order: {}", orderNum, e);

            // 构造错误响应
            JSONObject errorResult = new JSONObject();
            errorResult.put("error", true);
            errorResult.put("error_code", e.getCode());
            errorResult.put("error_message", e.getMessage());
            errorResult.put("order_number", orderNum);

            return errorResult;
        }
    }

    /**
     * 申请退款 (对应微信的 refund 方法)
     */
    public String refund(String paymentIntentId, String outRefundNo, BigDecimal refundAmount,
                         BigDecimal totalAmount, String reason) throws Exception {
        checkConfiguration();

        try {
            // 将退款金额转换为分
            Long refundAmountCents = refundAmount.multiply(new BigDecimal("100"))
                    .setScale(0, RoundingMode.HALF_UP)
                    .longValue();

            // 创建退款参数
            RefundCreateParams.Builder paramsBuilder = RefundCreateParams.builder()
                    .setPaymentIntent(paymentIntentId)
                    .setAmount(refundAmountCents)
                    .putMetadata("refund_number", outRefundNo);

            // 如果有退款原因，添加原因
            if (reason != null && !reason.trim().isEmpty()) {
                paramsBuilder.setReason(RefundCreateParams.Reason.REQUESTED_BY_CUSTOMER);
                paramsBuilder.putMetadata("reason", reason);
            }

            Refund refund = Refund.create(paramsBuilder.build());

            // 构造返回结果
            JSONObject result = new JSONObject();
            result.put("refund_id", refund.getId());
            result.put("payment_intent_id", paymentIntentId);
            result.put("refund_number", outRefundNo);
            result.put("amount", refund.getAmount());
            result.put("currency", refund.getCurrency());
            result.put("status", refund.getStatus());
            result.put("created", refund.getCreated());

            log.info("Refund created successfully: {} for PaymentIntent: {}", refund.getId(), paymentIntentId);
            return result.toJSONString();

        } catch (StripeException e) {
            log.error("Error creating refund for PaymentIntent: {}", paymentIntentId, e);

            // 构造错误响应
            JSONObject errorResult = new JSONObject();
            errorResult.put("error", true);
            errorResult.put("error_code", e.getCode());
            errorResult.put("error_message", e.getMessage());
            errorResult.put("payment_intent_id", paymentIntentId);
            errorResult.put("refund_number", outRefundNo);

            return errorResult.toJSONString();
        }
    }

    /**
     * 验证 Webhook 签名
     */
    public boolean verifyWebhookSignature(String payload, String sigHeader) {
        checkConfiguration();

        try {
            com.stripe.model.Event event = com.stripe.net.Webhook.constructEvent(
                    payload, sigHeader, stripeProperties.getWebhookSecret()
            );
            log.info("Webhook signature verified for event: {}", event.getType());
            return true;
        } catch (Exception e) {
            log.error("Webhook signature verification failed", e);
            return false;
        }
    }

    /**
     * 获取配置属性（用于其他组件访问）
     */
    public StripeProperties getStripeProperties() {
        return stripeProperties;
    }
}