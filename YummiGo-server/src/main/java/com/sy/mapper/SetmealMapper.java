package com.sy.mapper;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sy.dto.SetmealPageQueryDTO;
import com.sy.entity.Setmeal;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.sy.vo.SetmealVO;

import java.util.List;

/**
* @author kokomi
* @description 针对表【setmeal(セット)】的数据库操作Mapper
* @createDate 2025-08-06 22:25:11
* @Entity com.sy.entity.Setmeal
*/
public interface SetmealMapper extends BaseMapper<Setmeal> {

    // paginated query for combo meals/セットメニューのページネーション検索
    List<SetmealVO> pageQuerySetmealVO(Page<SetmealVO> page, SetmealPageQueryDTO dto);
}




