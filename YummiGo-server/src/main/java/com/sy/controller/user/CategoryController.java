package com.sy.controller.user;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.sy.entity.Category;
import com.sy.result.Result;
import com.sy.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController("userCategoryController")
@RequestMapping("user/category")
@Tag(name = "user-category api")
public class CategoryController {
    @Autowired
    private CategoryService categoryService;

    @GetMapping("list")
    @Operation(summary = "Query list")
    public Result<List<Category>> list(Integer type) {
        List<Category> list = categoryService.list(
                new LambdaQueryWrapper<Category>()
                        .eq(Category::getType, type)
        );
        return Result.success(list);
    }
}
