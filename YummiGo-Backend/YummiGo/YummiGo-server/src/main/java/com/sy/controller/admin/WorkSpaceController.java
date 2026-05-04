package com.sy.controller.admin;

import com.sy.result.Result;
import com.sy.service.WorkSpaceService;
import com.sy.vo.BusinessDataVO;
import com.sy.vo.DishOverViewVO;
import com.sy.vo.OrderOverViewVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.LocalTime;

@RestController("WorkSpaceController")
@Slf4j
@RequestMapping("admin/workspace")
@Tag(name = "A-WorkSpace-API")
public class WorkSpaceController {
    @Autowired
    private WorkSpaceService workSpaceService;

    /**
     * Get today's business data
     * @return
     */
    @GetMapping("/businessData")
    @Operation(summary="Today business data")
    public Result<BusinessDataVO> businessData(){
        log.info("businessData");
        LocalDateTime begin = LocalDateTime.now().with(LocalTime.MIN);
        LocalDateTime end = LocalDateTime.now().with(LocalTime.MAX);

        BusinessDataVO businessDataVO = workSpaceService.getBusinessData(begin,end);
        return Result.success(businessDataVO);
    }

    /**
     * get order overview data
     * @return
     */
    @GetMapping("/overviewOrders")
    @Operation(summary = "Orders overview data")
    public Result<OrderOverViewVO> orderOverView(){
        log.info("orderOverView");
        return Result.success(workSpaceService.getOrderOverView());
    }

    /**
     * get today's dishes overview data
     * @return
     */
    @GetMapping("/overviewDishes")
    @Operation(summary = "Dishes overview data")
    public Result<DishOverViewVO> dishOverView(){
        log.info("dishOverView");
        return Result.success(workSpaceService.getDishOverViewVO());
    }


}
