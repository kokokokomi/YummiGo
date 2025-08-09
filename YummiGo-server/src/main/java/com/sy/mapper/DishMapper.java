package com.sy.mapper;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sy.dto.DishPageQueryDTO;
import com.sy.entity.Dish;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.sy.vo.DishVO;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
* @author kokomi
* @description 针对表【dish(料理)】的数据库操作Mapper
* @createDate 2025-08-06 22:25:11
* @Entity com.sy.entity.Dish
*/
public interface DishMapper extends BaseMapper<Dish> {

    List<DishVO> selectDishVOPage(Page<DishVO> page, @Param("dto") DishPageQueryDTO dto);

    //get dishes by setmeal id
    List<Dish> getBySetmealId(Long id);
}




