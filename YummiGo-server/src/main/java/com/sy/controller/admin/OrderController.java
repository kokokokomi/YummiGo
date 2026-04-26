package com.sy.controller.admin;

import com.sy.dto.OrdersPageQueryDTO;
import com.sy.result.PageResult;
import com.sy.result.Result;
import com.sy.service.OrdersService;
import com.sy.vo.OrderStatisticsVO;
import com.sy.vo.OrderVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController("adminOrderController")
@RequestMapping("admin/order")
@Slf4j
@Tag(name = "A-Order-API")
public class OrderController {

    @Autowired
    private OrdersService ordersService;

    /**
     * 待处理(待接单)、待派送(已接单待配送)、派送中 数量
     */
    @GetMapping("statistics")
    @Operation(summary = "Order status")
    public Result<OrderStatisticsVO> orderStatistics() {
        log.info("Order statistics runrunrun");
        return Result.success(ordersService.orderStatistics());
    }

    @GetMapping("page")
    public Result<PageResult> ordersPage(@ParameterObject OrdersPageQueryDTO ordersPageQueryDTO) {
        log.info("ordersPageQueryDTO:{}", ordersPageQueryDTO);
        PageResult result = ordersService.orderPageQuery(ordersPageQueryDTO, null);
        return Result.success(result);
    }

    /**
     * 订单详情（商家端）
     */
    @GetMapping("/{id:\\d+}")
    @Operation(summary = "Order detail ")
    public Result<OrderVO> getOrderById(@PathVariable Long id) {
        log.info("admin getOrderById: {}", id);
        OrderVO vo = ordersService.getOrderById(id, null);
        return Result.success(vo);
    }
}
