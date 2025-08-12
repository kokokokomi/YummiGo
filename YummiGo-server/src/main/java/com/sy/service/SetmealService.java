package com.sy.service;

import com.sy.dto.SetmealDTO;
import com.sy.dto.SetmealPageQueryDTO;
import com.sy.entity.Setmeal;
import com.baomidou.mybatisplus.extension.service.IService;
import com.sy.result.PageResult;
import com.sy.vo.DishItemVO;
import com.sy.vo.SetmealVO;

import java.util.List;

/**
* @author kokomi
* @description 针对表【setmeal(セット)】的数据库操作Service
* @createDate 2025-08-06 22:25:11
*/
public interface SetmealService extends IService<Setmeal> {

    //Add a new combo meal while saving the association between the combo and dishes/新しいセットメニューを追加し、同時にセットメニューと料理の関連関係を保存する
    void addSetmeal(SetmealDTO setmealDTO);

    //paginated query for combo meals/セットメニューのページネーション検索
    PageResult pageQuerySetmeal(SetmealPageQueryDTO setmealPageQueryDTO);

    //Batch delete combo meals/セットメニューの一括削除
    void deleteSetmeal(List<Long> ids);

    //Query combo meal and associated dish data by ID/IDに基づいてセットメニューと関連料理データを検索
    SetmealVO querySetmealById(Long id);

    //update setmeal /セットを更新する
    void updateSetmeal(SetmealDTO setmealDTO);

    //activation/deactivation/セットメニューの販売開始/停止
    void startOrStopSet(Long id);

    //query dish list by setmeal id
    List<DishItemVO> getDishItemById(Long id);
}
