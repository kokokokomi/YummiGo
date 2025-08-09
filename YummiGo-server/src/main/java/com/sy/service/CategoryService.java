package com.sy.service;

import com.sy.dto.CategoryDTO;
import com.sy.dto.CategoryPageQueryDTO;
import com.sy.entity.Category;
import com.baomidou.mybatisplus.extension.service.IService;
import com.sy.result.PageResult;
import com.sy.result.Result;

import java.util.List;

/**
* @author kokomi
* @description 针对表【category(料理・セット分類)】的数据库操作Service
* @createDate 2025-08-06 22:25:11
*/
public interface CategoryService extends IService<Category> {

    //Add Category	カテゴリを追加する 新增分类
    Result addCategory(CategoryDTO categoryDTO);

    //分类分页查询	Category Pagination Query	カテゴリページネーション検索
    PageResult pageQuery(CategoryPageQueryDTO categoryPageQueryDTO);

    //修改分类	Update Category	カテゴリを更新する
    Result updateCategory(CategoryDTO categoryDTO);

    //delete Category
    void deleteById(Long id);

    //启用/禁用分类	Enable/Disable Category	カテゴリを有効化/無効化する
    void changeCategoryStatus(Integer status, Long id);

    //根据类型查询分类	Query Categories by Type	タイプ別にカテゴリを検索する
    List<Category> listCategory(Integer type);
}
