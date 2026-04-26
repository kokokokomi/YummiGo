package com.sy.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class OrderPageVO implements Serializable {

    private Long id;

    private String number;

    private Integer status;

    private String userName;

    private LocalDateTime orderTime;

    private BigDecimal amount;

    private String phone;

    private String orderGoodsSnapshot;

}
