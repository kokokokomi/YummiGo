package com.sy.mapper;

import com.sy.entity.SetmealDish;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
* @author kokomi
* @description 针对表【setmeal_dish(セット料理関係)】的数据库操作Mapper
* @createDate 2025-08-06 22:25:11
* @Entity com.sy.entity.SetmealDish
*/
public interface SetmealDishMapper extends BaseMapper<SetmealDish> {

    @Select("SELECT setmeal_id FROM setmeal_dish WHERE dish_id = #{id}")
    List<Long> getSetmealIdsByDishId(Long id);

    //Determine if the current dish is associated with a set menu
//    List<Long> getSetmealIdsByDishIds(List<Long> ids);
}




