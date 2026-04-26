package com.sy.controller.user;

import com.sy.exception.PaymentException;
import com.sy.service.OrdersService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController("userStripeController")
@Slf4j
@RequestMapping("user/stripe")
@Tag(name = "Stripe API")
public class StripeController {
    @Autowired
    private OrdersService ordersService;

    /**
     * Stripe Webhook：需返回 2xx 且 body 任意；签名校验失败应 4xx，避免无意义重试。
     */
    @PostMapping("webhook")
    public ResponseEntity<String> handleWebhook(
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
