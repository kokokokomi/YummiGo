package com.sy.controller.user;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.sy.constant.StatusConstant;
import com.sy.entity.Setmeal;
import com.sy.result.Result;
import com.sy.service.SetmealService;
import com.sy.vo.DishItemVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController("userSetmealController")
@Slf4j
@RequestMapping("user/setmeal")
@Tag(name = "C-user-setmeal api")
public class SetmealController {
    @Autowired
    private SetmealService setmealService;

    /**
     * Query setmeal by categoryid
     * @param categoryid
     * @return
     */
    @GetMapping("list")
    @Operation(summary = "Query setmeal by categoryid")
    @Cacheable(cacheNames = "setmealCache",key = "#categoryId")
    public Result<List<Setmeal>> list(@RequestParam Long categoryid) {
        List<Setmeal> list = setmealService.list(
                new LambdaQueryWrapper<Setmeal>()
                        .eq(Setmeal::getCategoryId, categoryid)
                        .eq(Setmeal::getStatus, StatusConstant.ENABLE)
        );
        return Result.success(list);
    }

    /**
     * query dish list by setmeal id
     * @param id
     * @return
     */
    @GetMapping("dish/{id}")
    @Operation(summary = "query dish list by setmeal id")
    public Result<List<DishItemVO>> dishList(@PathVariable("id") Long id) {
        List<DishItemVO> list=setmealService.getDishItemById(id);
        return Result.success(list);
    }
}
