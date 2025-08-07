package com.sy.config;

import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.OpenAPI;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPIを利用する
 * APIドキュメントを生成する
 * スキャンパスを設定する
 */
@Configuration
public class Knife4jConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Yummi Go API Server")
                        .version("2.0")
                        .description("API document"));
    }

    @Bean
    public GroupedOpenApi ygApi() {
        return GroupedOpenApi.builder()
                .group("API")
                .packagesToScan("com.sy.controller")
                .build();
    }
}