package com.sy.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.sy.annotation.AutoFill;
import com.sy.constant.MessageConstant;
import com.sy.constant.StatusConstant;
import com.sy.context.BaseContext;
import com.sy.dto.CategoryDTO;
import com.sy.dto.CategoryPageQueryDTO;
import com.sy.entity.Category;
import com.sy.entity.Dish;
import com.sy.entity.Employee;
import com.sy.entity.Setmeal;
import com.sy.enumeration.OperationType;
import com.sy.exception.DeletionNotAllowedException;
import com.sy.mapper.DishMapper;
import com.sy.mapper.SetmealMapper;
import com.sy.result.PageResult;
import com.sy.result.Result;
import com.sy.service.CategoryService;
import com.sy.mapper.CategoryMapper;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
* @author kokomi
* @description 针对表【category(料理・セット分類)】的数据库操作Service实现
* @createDate 2025-08-06 22:25:11
*/
@Service
public class CategoryServiceImpl extends ServiceImpl<CategoryMapper, Category>
    implements CategoryService{

    @Autowired
    private CategoryMapper categoryMapper;
    @Autowired
    private DishMapper dishMapper;
    @Autowired
    private SetmealMapper setmealMapper;

    @Override
//    @AutoFill(OperationType.UPDATE)
    public Result addCategory(CategoryDTO categoryDTO) {
        Category category = Category.builder()
//                .id(categoryDTO.getId())
                .name(categoryDTO.getName())
                .type(categoryDTO.getType())
                .sort(categoryDTO.getSort())
                .status(StatusConstant.DISABLE)//default
                .build();
        categoryMapper.insert(category);
        return Result.success();
    }

    @Override
    public PageResult pageQuery(CategoryPageQueryDTO categoryPageQueryDTO) {
        Page<Category> page = new Page<>(categoryPageQueryDTO.getPage(), categoryPageQueryDTO.getPageSize());
        LambdaQueryWrapper<Category> queryWrapper = new LambdaQueryWrapper<>();
        if (StringUtils.isNotBlank(categoryPageQueryDTO.getName())) {
            queryWrapper.like(Category::getName, categoryPageQueryDTO.getName());
        }
        Optional.ofNullable(categoryPageQueryDTO.getType())
                .ifPresent(type -> queryWrapper.eq(Category::getType, type));
        queryWrapper.orderByDesc(Category::getCreateTime);
        categoryMapper.selectPage(page, queryWrapper);

        PageResult pageResult = new PageResult();
        pageResult.setTotal(page.getTotal());
        pageResult.setRecords(page.getRecords());
        return pageResult;
    }
    @Override
    public void deleteById(Long id) {
        //check if the category contacts with dishes
        LambdaQueryWrapper<Dish> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Dish::getCategoryId, id);
        Integer count = dishMapper.selectCount(wrapper).intValue();
        if (count > 0) {
            throw new DeletionNotAllowedException(MessageConstant.CATEGORY_BE_RELATED_BY_DISH);
        }
        //check if it's connected with set
        LambdaQueryWrapper<Setmeal> wrapper1 = new LambdaQueryWrapper<>();
        wrapper1.eq(Setmeal::getCategoryId, id);
        count=setmealMapper.selectCount(wrapper1).intValue();
        if (count > 0) {
            throw new DeletionNotAllowedException(MessageConstant.CATEGORY_BE_RELATED_BY_SETMEAL);
        }
        categoryMapper.deleteById(id);
    }


    //修改分类	Update Category	カテゴリを更新する
    @Override
//    @AutoFill(OperationType.UPDATE)
    public Result updateCategory(CategoryDTO categoryDTO) {
        Category category=Category.builder()
                .id(categoryDTO.getId())
                .type(categoryDTO.getType())
                .name(categoryDTO.getName())
                .sort(categoryDTO.getSort())
                .build();
        categoryMapper.updateById(category);
        return Result.success();
    }

    //启用/禁用分类	Enable/Disable Category	カテゴリを有効化/無効化する
    @Override
//    @AutoFill(OperationType.UPDATE)
    public void changeCategoryStatus(Long id) {
        Category cat = categoryMapper.selectById(id);
        Integer status = cat.getStatus();
        cat.setStatus(status==StatusConstant.ENABLE?StatusConstant.DISABLE:StatusConstant.ENABLE);
        categoryMapper.updateById(cat);
    }

//根据类型查询分类	Query Categories by Type	タイプ別にカテゴリを検索する
    @Override
    public List<Category> listCategory(Integer type) {
        LambdaQueryWrapper<Category> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Category::getStatus, StatusConstant.ENABLE);
        if (type != null) {
            wrapper.eq(Category::getType, type);
        }
        wrapper.orderByAsc(Category::getSort)
                .orderByDesc(Category::getCreateTime);

        return categoryMapper.selectList(wrapper);
    }

}




