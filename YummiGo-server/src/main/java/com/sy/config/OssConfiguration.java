package com.sy.config;

import com.sy.properties.AliOssProperties;
import com.sy.utils.AliOssUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@Slf4j
public class OssConfiguration {

    @Bean
    @ConditionalOnMissingBean//only one aliossutil
    public AliOssUtil aliOssUtil(AliOssProperties aliOssProperties) {
        log.info("aliOssUtil aliOssProperties:{}", aliOssProperties);
       return new AliOssUtil(aliOssProperties.getEndpoint()
                ,aliOssProperties.getAccessKeyId()
                ,aliOssProperties.getAccessKeySecret()
                ,aliOssProperties.getBucketName());
    }
}
