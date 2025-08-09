package com.sy.controller.admin;

import com.sy.dto.SetmealDTO;
import com.sy.dto.SetmealPageQueryDTO;
import com.sy.result.PageResult;
import com.sy.result.Result;
import com.sy.service.SetmealService;
import com.sy.vo.SetmealVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/setmeal")
@Slf4j
@Tag(name = "Setmeal api")
public class SetmealController {
    @Autowired
    private SetmealService setmealService;

    /**
     * Add a new combo meal while saving the association between the combo and dishes
     * 新しいセットメニューを追加し、同時にセットメニューと料理の関連関係を保存する
     * @param setmealDTO
     * @return
     */
    @PostMapping
    @Operation(summary = "Add combo meal")
    public Result addSetmeal(@RequestBody SetmealDTO setmealDTO) {
        setmealService.addSetmeal(setmealDTO);
        return Result.success();
    }

    /**
     * paginated query for combo meals
     * セットメニューのページネーション検索
     * @param setmealPageQueryDTO
     * @return
     */
    @GetMapping("page")
    @Operation(summary = "page query setmeal")
    public Result<PageResult> pageQuerySetmeal(@ParameterObject SetmealPageQueryDTO setmealPageQueryDTO) {
        log.info("pageQuerySetmeal: {}", setmealPageQueryDTO);
        PageResult result=setmealService.pageQuerySetmeal(setmealPageQueryDTO);
        return Result.success(result);
    }

    /**
     * Batch delete combo meals (cannot delete combos that are currently being sold)
     * セットメニューの一括削除（販売中のセットは削除不可）
     * @param ids
     * @return
     */
    @DeleteMapping
    @Operation(summary = "Delete setMeal")
    public Result deleteSetmeal(@RequestParam List<Long> ids) {
        log.info("deleteSetmeal: {}", ids);
        setmealService.deleteSetmeal(ids);
        return Result.success();
    }

    /**
     * Query combo meal and associated dish data by ID(for edit page data display)
     * IDに基づいてセットメニューと関連料理データを検索(編集ページのデータ表示用）
     * @param id
     * @return
     */

    @GetMapping("/{id}")
    @Operation(summary = "query setmeal by id")
    public Result<SetmealVO> querySetmealById(@PathVariable Long id) {
        log.info("querySetmealById: {}", id);
        SetmealVO setmealVO=setmealService.querySetmealById(id);
        return Result.success(setmealVO);
    }

    /**
     * update setmeal /セットを更新する
     * @param setmealDTO
     * @return
     */
    @PutMapping
    @Operation(summary = "Update setmeal")
    public Result updateSetmeal(@RequestBody SetmealDTO setmealDTO){
        setmealService.updateSetmeal(setmealDTO);
        return Result.success();
    }

    /**
     * activation/deactivation/セットメニューの販売開始/停止
     * @param status
     * @param id setmeal id
     * @return
     */
    @PostMapping("status/{status}")
    @Operation(summary = "active/deactivation setmeal")
    public Result startOrStopSet(@PathVariable Integer status,Long id){
        setmealService.startOrStopSet(status,id);
        return Result.success();
    }


}
