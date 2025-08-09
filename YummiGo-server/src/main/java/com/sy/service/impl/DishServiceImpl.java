package com.sy.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.sy.constant.MessageConstant;
import com.sy.constant.StatusConstant;
import com.sy.dto.DishDTO;
import com.sy.dto.DishPageQueryDTO;
import com.sy.entity.*;
import com.sy.exception.DeletionNotAllowedException;
import com.sy.mapper.*;
import com.sy.result.PageResult;
import com.sy.result.Result;
import com.sy.service.DishService;
import com.sy.vo.DishVO;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
* @author kokomi
* @description 针对表【dish(料理)】的数据库操作Service实现
* @createDate 2025-08-06 22:25:11
*/
@Service
public class DishServiceImpl extends ServiceImpl<DishMapper, Dish>
    implements DishService{
    @Autowired
    private DishMapper dishMapper;

    @Autowired
    private DishFlavorMapper dishFlavorMapper;

    @Autowired
    private SetmealMapper setmealMapper;

    @Autowired
    private SetmealDishMapper setmealDishMapper;

    /**
     * add new dish with its flavor
     * @param dishDTO
     * @return
     */
    @Override
    @Transactional
    public Result addDishWithFlavor(DishDTO dishDTO) {
        Dish dish = new Dish();
        BeanUtils.copyProperties(dishDTO, dish);
        dishMapper.insert(dish);

        //TODO: check test
        List<DishFlavor> flavors = dishDTO.getFlavors();
        //set dish id for every dishFlavor(dishID,id,name,value..)
        if (flavors != null && !flavors.isEmpty()) {
            Long dishId = dish.getId();
            flavors.forEach(flavor -> flavor.setDishId(dishId));
            dishFlavorMapper.insert(flavors);
        }
        return Result.success();
    }

    /**
     * Dish Pagination Query	料理ページネーション検索
     * @param dto
     * @return
     */
    @Override
    public PageResult dishPageQuery(DishPageQueryDTO dto) {
        Page<DishVO> page = new Page<>(dto.getPage(), dto.getPageSize());
        List<DishVO> records = dishMapper.selectDishVOPage(page, dto);
        page.setRecords(records);
        return new PageResult(page.getTotal(), page.getRecords());
    }

    /**
     * Delete dishes in bulk./まとめて削除する
     * @param ids
     */
    @Override
    @Transactional
    public void deleteDish(List<Long> ids) {
        //Determine if the current dish can be deleted---Are there any dishes currently being sold?
        //現在の料理が削除可能かどうかを判断する---販売中の料理が存在するか？
        for (Long id : ids) {
            Dish dish = dishMapper.selectById(id);
            if(dish.getStatus() == StatusConstant.ENABLE){
                //currently being sold
                throw new DeletionNotAllowedException(MessageConstant.DISH_ON_SALE);

            }
        }
        //Determine if the current dish can be deleted---Is it associated with a set menu?
        //現在の料理が削除可能かどうかを判断する---セットメニューに関連付けられているか？
        //using java stream
        List<Long> collect = setmealDishMapper.selectList(
                        new LambdaQueryWrapper<SetmealDish>()
                                .in(SetmealDish::getDishId, ids)
                ).stream()
                .map(SetmealDish::getSetmealId)
                .distinct()
                .collect(Collectors.toList());
        if(collect !=null && collect.size()>0){
            throw new DeletionNotAllowedException(MessageConstant.DISH_BE_RELATED_BY_SETMEAL);
        }
        dishMapper.deleteBatchIds(ids);
        //Delete the flavor data associated with the dish
        //料理に関連付けられた味覚データを削除
        dishFlavorMapper.delete(
                new LambdaQueryWrapper<DishFlavor>()
                        .in(DishFlavor::getDishId, ids)
        );

    }

    /**
     * Query dish and dish flavors by ID/IDに基づいて料理と味覚データを検索
     * @param id
     * @return
     */
    @Override
    public DishVO queryDishWithFlavor(Long id) {
        Dish dish = dishMapper.selectById(id);
        List<DishFlavor> dishFlavor = dishFlavorMapper.selectList(
                new LambdaQueryWrapper<DishFlavor>().eq(DishFlavor::getDishId, id)
        );
        DishVO dishVO = new DishVO();
        BeanUtils.copyProperties(dish, dishVO);
        dishVO.setFlavors(dishFlavor);
        return dishVO;
    }

    /**
     * Modify dish and its associated flavor data/料理とその関連する味付けデータを変更する
     * by id
     * @param dishDTO
     */
    @Override
    @Transactional
    public void updateDishWithFlavor(DishDTO dishDTO) {
        Dish dish = new Dish();
        BeanUtils.copyProperties(dishDTO, dish);

        LambdaUpdateWrapper<Dish> wrapper = new LambdaUpdateWrapper<>();
        wrapper.eq(Dish::getId, dishDTO.getId());

        if (dish.getName() != null) {
            wrapper.set(Dish::getName, dish.getName());
        }
        if (dish.getCategoryId() != null) {
            wrapper.set(Dish::getCategoryId, dish.getCategoryId());
        }
        if (dish.getPrice() != null) {
            wrapper.set(Dish::getPrice, dish.getPrice());
        }
        if (dish.getImage() != null) {
            wrapper.set(Dish::getImage, dish.getImage());
        }
        if (dish.getDescription() != null) {
            wrapper.set(Dish::getDescription, dish.getDescription());
        }
        if (dish.getStatus() != null) {
            wrapper.set(Dish::getStatus, dish.getStatus());
        }

        dishMapper.update(dish, wrapper);
        //delete old flavor
        dishFlavorMapper.delete(
                new LambdaQueryWrapper<DishFlavor>()
                        .in(DishFlavor::getDishId,dishDTO.getId())
        );
        List<DishFlavor> flavors = dishDTO.getFlavors();
        //set dish id for every dishFlavor(dishID,id,name,value..)
        if (flavors != null && !flavors.isEmpty()) {
            Long dishId = dish.getId();
            flavors.forEach(flavor -> flavor.setDishId(dishId));
            dishFlavorMapper.insert(flavors);
        }

    }

    /**Query dishes by category ID/分類IDに基づいて料理を検索
     *
     * @param categoryId
     * @return
     */
    @Override
    public List<Dish> dishList(Long categoryId) {
        return dishMapper.selectList(
                new LambdaQueryWrapper<Dish>()
                        .eq(Dish::getCategoryId, categoryId)
                        .eq(Dish::getStatus, StatusConstant.ENABLE)
        );
    }

    /**
     * activation/deactivation dish 料理の販売開始/停止:
     * For deactivation operations: must also deactivate any combos containing this dish
     * 販売停止操作の場合、当該料理を含むセットメニューも同時に停止する必要あり
     * @param status
     * @param id
     */
    @Override
    @Transactional
    public void startOrStopDish(Integer status, Long id) {
        Dish dish=dishMapper.selectById(id);
        dish.setStatus(status);
        dishMapper.updateById(dish);
        if(status==StatusConstant.DISABLE){
            List<Long> setmealIds = setmealDishMapper.getSetmealIdsByDishId(id);
            if(setmealIds!=null && setmealIds.size()>0){
                for(Long setmealId:setmealIds){
                    Setmeal current = setmealMapper.selectById(setmealId);
                    current.setStatus(StatusConstant.DISABLE);
                    setmealMapper.updateById(current);
                }
            }
        }
    }


}




