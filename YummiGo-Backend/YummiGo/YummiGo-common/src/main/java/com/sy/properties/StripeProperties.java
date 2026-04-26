package com.sy.properties;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

//@Component
//@ConfigurationProperties(prefix = "sy.stripe")
@Data
public class StripeProperties {

    /**
     * Stripe 公开密钥 (publishable key)
     */
    private String publishableKey;

    /**
     * Stripe 密钥 (secret key)
     */
    private String secretKey;

    /**
     * Webhook 签名密钥
     */
    private String webhookSecret;

    /**
     * 货币类型，默认为日元
     */
    private String currency = "jpy";

    /**
     * 成功回调URL
     */
    private String successUrl;

    /**
     * 取消回调URL
     */
    private String cancelUrl;

    /**
     * Webhook 通知URL
     */
    private String webhookUrl;

    /**
     * 退款通知URL
     */
    private String refundNotifyUrl;

    /**
     * 公司名称
     */
    private String companyName;

    /**
     * 产品名称
     */
    private String productName;

    /**
     * 构造函数，支持手动设置（用于测试或特殊场景）
     */
    public StripeProperties() {}

    /**
     * 带参构造函数，支持程序化配置
     */
    public StripeProperties(String publishableKey, String secretKey) {
        this.publishableKey = publishableKey;
        this.secretKey = secretKey;
    }

    /**
     * 验证必要配置是否存在
     */
    public boolean isValid() {
        return publishableKey != null && !publishableKey.trim().isEmpty() &&
                secretKey != null && !secretKey.trim().isEmpty();
    }

    /**
     * 获取配置摘要（隐藏敏感信息）
     */
    public String getConfigSummary() {
        return String.format("StripeProperties{currency='%s', companyName='%s', " +
                        "publishableKey='%s...', secretKey='%s...'}",
                currency, companyName,
                publishableKey != null ? publishableKey.substring(0, Math.min(10, publishableKey.length())) : "null",
                secretKey != null ? secretKey.substring(0, Math.min(10, secretKey.length())) : "null");
    }
}