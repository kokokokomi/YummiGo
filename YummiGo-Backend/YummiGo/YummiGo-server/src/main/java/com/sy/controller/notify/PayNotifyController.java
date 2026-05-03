package com.sy.controller.notify;

import com.sy.exception.PaymentException;
import com.sy.service.OrdersService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Stripe 异步通知（Webhook）。<br/>
 * 亦可使用 {@code POST /user/stripe/webhook}，二者配置其一即可。<br/>
 * 支付成功后的业务与商家 WebSocket 推送在 {@link OrdersService#handleWebhook} → {@code handlePaymentSuccess} 中完成。
 */
@RestController
@RequestMapping("/notify")
@Slf4j
public class PayNotifyController {

    @Autowired
    private OrdersService ordersService;

    /**
     * Stripe Webhook：须使用原始请求体验签。<br/>
     * Dashboard Endpoint
     */
    @PostMapping("/stripe/webhook")
    public ResponseEntity<String> stripeWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "Stripe-Signature", required = false) String sigHeader) {
        if (sigHeader == null || sigHeader.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("missing Stripe-Signature");
        }
        try {
            ordersService.handleWebhook(payload, sigHeader);
            return ResponseEntity.ok("");
        } catch (PaymentException e) {
            log.error("Stripe Webhook 业务异常: {}", e.getMessage());
            String msg = e.getMessage() != null ? e.getMessage() : "";
            if (msg.contains("Invalid signature") || msg.contains("Invalid payload")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("invalid");
            }
            if (msg.contains("webhook not configured")) {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body("not configured");
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("error");
        } catch (Exception e) {
            log.error("Stripe Webhook 处理失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("error");
        }
    }
}
