package com.sy.utils;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtBuilder;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.util.Date;
import java.util.Map;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;

import javax.crypto.SecretKey;


@Slf4j
public class JwtUtil {


    /**
     * Generate a JWT token using HS256 algorithm and a symmetric secret key.
     *
     * @param secretKey The secret key used for signing the JWT (must be kept secure).
     * @param ttlMillis Token validity duration in milliseconds.
     * @param claims    Custom claims to include in the payload.
     * @return A signed JWT token string.
     */
    public static String createJWT(String secretKey, long ttlMillis, Map<String, Object> claims) {
        SignatureAlgorithm signatureAlgorithm = SignatureAlgorithm.HS256;

        long nowMillis = System.currentTimeMillis();
        Date now = new Date(nowMillis);
        Date exp = new Date(nowMillis + ttlMillis);

        // Convert secret key to SecretKey object
        SecretKey key = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));

        JwtBuilder builder = Jwts.builder()
                .setClaims(claims)             // Set custom claims
                .setIssuedAt(now)              // Set issued time
                .setExpiration(exp)            // Set expiration time
                .signWith(key, signatureAlgorithm); // Sign with key and algorithm

        return builder.compact();
    }

    /**
     * Parse and validate a JWT token using the provided secret key.
     *
     * @param secretKey The secret key used to verify the token signature.
     * @param token     The JWT token string to be parsed.
     * @return Claims extracted from the token payload.
     * @throws JwtException if the token is invalid or expired.
     */
    public static Claims parseJWT(String secretKey, String token) {
        SecretKey key = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));

        return Jwts.parser()
                .verifyWith(key)            // Set key for signature verification
                .build()
                .parseSignedClaims(token)         // Parse and validate token
                .getPayload();                    // Extract claims
    }

    public Instant getExpirationInstant(String secretKey, String token) {
        try {
            SecretKey key = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));

            // Jwts.parser()...getExpiration() 返回的是 java.util.Date
            Date expirationDate = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload()
                    .getExpiration();

            // 将 java.util.Date 转换为 java.time.Instant
            return expirationDate.toInstant();

        } catch (Exception e) {
            log.warn("JWT wrong: {}", e.getMessage());
            return null;
        }
    }

    //Validate token authenticity
    public boolean isExpiration(String secretKey,String token) {
        try {
            SecretKey key = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));

            Date expiration = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload()
                    .getExpiration();

            return expiration.before(new Date());
        } catch (Exception e) {
            return true; // token not valid
        }
    }

}

