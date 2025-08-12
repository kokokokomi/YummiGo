package com.sy.controller.admin;

import com.sy.dto.CategoryDTO;
import com.sy.dto.CategoryPageQueryDTO;
import com.sy.entity.Category;
import com.sy.result.PageResult;
import com.sy.result.Result;
import com.sy.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("admin/category")
@Tag(name = "Category api")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    /**
     * 	Add Category	カテゴリを追加する 新增分类
     * @param categoryDTO
     * @return
     */
    @PostMapping
    @Operation(summary = "add category")
    public Result<String> addCategory(@RequestBody CategoryDTO categoryDTO) {
        log.info("add category:{}", categoryDTO);
        Result result=categoryService.addCategory(categoryDTO);
        return result;
    }
    /**
     *分类分页查询	Category Pagination Query	カテゴリページネーション検索
     */
    @GetMapping("page")
    @Operation(summary = "Category Pagination Query")
    public Result<PageResult> pageQuery(@ParameterObject CategoryPageQueryDTO categoryPageQueryDTO) {
        log.info("categoryPageQueryDTO:{}", categoryPageQueryDTO.toString());
        PageResult result=categoryService.pageQuery(categoryPageQueryDTO);
        return Result.success(result);
    }



    /**
     *删除分类	Delete Category	カテゴリを削除する
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete category")
    public Result<String> deleteById(@PathVariable Long id) {
        log.info("delete category id:{}", id) ;
        categoryService.deleteById(id);
        return Result.success();
    }

    /**
     * 修改分类	Update Category	カテゴリを更新する
     * @param categoryDTO
     * @return
     */
    @PutMapping
    @Operation(summary = "Update Category")
    public Result<String> updateCategory(@RequestBody CategoryDTO categoryDTO) {
        Result result=categoryService.updateCategory(categoryDTO);
        return result;

    }

    /**
     * 启用/禁用分类	Enable/Disable Category	カテゴリを有効化/無効化する
     * @param id
     * @return
     */

    @PutMapping("status/{id}")
    @Operation(summary = "Enable Disable category")
    public Result<String> changeCategoryStatus(@PathVariable Long id) {
        categoryService.changeCategoryStatus(id);
        return Result.success();
    }

    /**
     * 根据类型查询分类	Query Categories by Type	タイプ別にカテゴリを検索する
     * @param type
     * @return
     */
    @GetMapping("list")
    @Operation(summary = "Select category by type")
    public Result<List<Category>> listCategory(Integer type) {
        List<Category> list = categoryService.listCategory(type);
        return Result.success(list);
    }

    /**
     * For data display (re-populating forms in edit views)
     * データ表示用（編集画面などでのデータ再表示）
     * @param id
     * @return
     */
    @GetMapping("/{id}")
    @Operation(summary = "select by id")
    public Result<Category> getCategoryById(@PathVariable("id") Long id) {
        Category byId = categoryService.getById(id);
        return Result.success(byId);
    }

}
