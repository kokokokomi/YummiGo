package com.sy;

import lombok.extern.slf4j.Slf4j;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication
@EnableTransactionManagement
@Slf4j
@MapperScan(basePackages = "com.sy.mapper")
public class Main {
    public static void main(String[] args) {
        SpringApplication.run(Main.class,args);
        log.info("server started");
    }
}
