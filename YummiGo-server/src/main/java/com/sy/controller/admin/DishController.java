package com.sy.controller.admin;

import com.sy.dto.DishDTO;
import com.sy.dto.DishPageQueryDTO;
import com.sy.entity.Dish;
import com.sy.result.PageResult;
import com.sy.result.Result;
import com.sy.service.DishService;
import com.sy.vo.DishVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("admin/dish")
@Slf4j
@Tag(name = "Dish api")
public class DishController {
    @Autowired
    private DishService dishService;

    /**
     * Adding new dishes and their related flavor data/新規料理と関連する味覚データの追加
     * @param dishDTO
     * @return
     */
    @PostMapping
    @Operation(summary = "Add new dish with flavor")
    public Result addDishWithFlavor(@RequestBody DishDTO dishDTO) {
        log.info("insert new dish:{}", dishDTO);
        Result result=dishService.addDishWithFlavor(dishDTO);
        return result;
    }

    /**
     * Dish Pagination Query	料理ページネーション検索
     * @param dto
     * @return
     */
    @GetMapping("page")
    @Operation(summary = "Dish Pagination Query")
    public Result<PageResult> dishPageQuery(@ParameterObject DishPageQueryDTO dto){
        log.info("dish page:{}", dto);
        PageResult result=dishService.dishPageQuery(dto);
        return Result.success(result);
    }

    /**
     * You can delete dishes one by one or in bulk./一品ずつ削除することも、まとめて削除することもできます。
     * Dishes that are currently being sold cannot be deleted./販売中の商品は削除できません。
     * Dishes associated with a set menu cannot be deleted./セットメニューに関連付けられている商品は削除できません。
     * When a dish is deleted, the related flavor data will also be removed./商品を削除すると、関連する味覚データも削除されます。
     */
    @DeleteMapping
    @Operation(summary = "Delete dish")
    public Result deleteDish(@RequestParam List<Long> ids) {
        log.info("delete dish:{}", ids);
        dishService.deleteDish(ids);
        return Result.success();
    }

    /**
     *Query dish by ID
     * IDに基づいて料理を検索
     * @param id
     * @return
     */
    @GetMapping("/{id}")
    @Operation(summary = "Query dish")
    public Result<DishVO> queryDishWithFlavor(@PathVariable Long id) {
        log.info("query dish with flavour:{}", id);
        DishVO result=dishService.queryDishWithFlavor(id);
        return Result.success(result);
    }

    /**
     *Modify dish and its associated flavor data
     * 料理とその関連する味付けデータを変更する
     * @param dishDTO
     * @return
     */
    @PutMapping
    @Operation(summary = "update Dish")
    public Result updateDishWithFlavor(@RequestBody DishDTO dishDTO){
        log.info("update dish:{}", dishDTO);
        dishService.updateDishWithFlavor(dishDTO);
        return Result.success();
    }

}
