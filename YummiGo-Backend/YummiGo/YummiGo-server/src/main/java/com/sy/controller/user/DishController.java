package com.sy.controller.user;

import com.sy.result.Result;
import com.sy.service.DishService;
import com.sy.vo.DishVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController("userDishController")
@Slf4j
@RequestMapping("user/dish")
@Tag(name = "C-user-dish api")
public class DishController {
    @Autowired
    private DishService dishService;

    /**
     * query dish by category id
     * @param categoryId
     * @return
     */
    @GetMapping("list")
    @Operation(summary = "query dish by category id")
    public Result<List<DishVO>> list(Long categoryId) {
        List<DishVO> list = dishService.dishList(categoryId);
        return Result.success(list);
    }

    @GetMapping("getDishWithFlavor")
    @Operation(summary = "Query dish with its releated dish flavor by id")
    public Result<DishVO> getDishWithFlavor(Long dishId) {
        log.info("query dish with flavour:{}", dishId);
        DishVO result=dishService.queryDishWithFlavor(dishId);
        return Result.success(result);
    }

}
