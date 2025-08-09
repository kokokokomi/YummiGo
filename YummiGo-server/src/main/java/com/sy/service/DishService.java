package com.sy.service;

import com.sy.dto.DishDTO;
import com.sy.dto.DishPageQueryDTO;
import com.sy.entity.Dish;
import com.baomidou.mybatisplus.extension.service.IService;
import com.sy.result.PageResult;
import com.sy.result.Result;
import com.sy.vo.DishVO;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
* @author kokomi
* @description 针对表【dish(料理)】的数据库操作Service
* @createDate 2025-08-06 22:25:11
*/
public interface DishService extends IService<Dish> {

    //Adding new dishes and their related flavor data/新規料理と関連する味覚データの追加
    Result addDishWithFlavor(DishDTO dishDTO);

    //Dish Pagination Query	料理ページネーション検索
    PageResult dishPageQuery(DishPageQueryDTO dto);

     //Delete dishes in bulk /まとめて削除する
    void deleteDish(List<Long> ids);

    //Query dish by ID/IDに基づいて料理を検索
    DishVO queryDishWithFlavor(Long id);

    // Modify dish and its associated flavor data/料理とその関連する味付けデータを変更する
    void updateDishWithFlavor(DishDTO dishDTO);

     // Query dishes by category ID/分類IDに基づいて料理を検索
    List<Dish> dishList(Long categoryId);

    //  activation/deactivation dish 料理の販売開始/停止
    void startOrStopDish(Integer status, Long id);
}
