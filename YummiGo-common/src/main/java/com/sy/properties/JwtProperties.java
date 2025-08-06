package com.sy.properties;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "sy.jwt")
@Data
public class JwtProperties {

    /**
     * JWT token setup for admin staff
     */
    private String adminSecretKey;
    private long adminTtl;
    private String adminTokenName;

    /**
     * JWT token setup for user
     */
    private String userSecretKey;
    private long userTtl;
    private String userTokenName;

}
