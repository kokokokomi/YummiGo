package com.sy.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.sy.constant.MessageConstant;
import com.sy.constant.StatusConstant;
import com.sy.dto.SetmealDTO;
import com.sy.dto.SetmealPageQueryDTO;
import com.sy.entity.Dish;
import com.sy.entity.Setmeal;
import com.sy.entity.SetmealDish;
import com.sy.exception.DeletionNotAllowedException;
import com.sy.mapper.DishMapper;
import com.sy.mapper.SetmealDishMapper;
import com.sy.result.PageResult;
import com.sy.service.SetmealService;
import com.sy.mapper.SetmealMapper;
import com.sy.vo.SetmealVO;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
* @author kokomi
* @description 针对表【setmeal(セット)】的数据库操作Service实现
* @createDate 2025-08-06 22:25:11
*/
@Service
public class SetmealServiceImpl extends ServiceImpl<SetmealMapper, Setmeal>
    implements SetmealService{
    @Autowired
    private SetmealMapper setmealMapper;
    @Autowired
    private SetmealDishMapper setmealDishMapper;
    @Autowired
    private DishMapper dishMapper;

    /**
     * Add a new combo meal while saving the association between the combo and dishes
     * 新しいセットメニューを追加し、同時にセットメニューと料理の関連関係を保存する
     * @param setmealDTO
     */
    @Override
    @Transactional
    public void addSetmeal(SetmealDTO setmealDTO) {
        Setmeal setmeal= new Setmeal();
        BeanUtils.copyProperties(setmealDTO,setmeal);
        setmealMapper.insert(setmeal);
        Long setmealId = setmeal.getId();

        List<SetmealDish> setmealDishes = setmealDTO.getSetmealDishes();
        setmealDishes.forEach(setmealDish -> {
            setmealDish.setSetmealId(setmealId);
        });
        setmealDishMapper.insert(setmealDishes);
    }

    /**
     * paginated query for combo meals/セットメニューのページネーション検索
     * @param setmealPageQueryDTO
     * @return
     */
    @Override
    public PageResult pageQuerySetmeal(SetmealPageQueryDTO setmealPageQueryDTO) {
        Page<SetmealVO> page=new Page<>(setmealPageQueryDTO.getPage(),setmealPageQueryDTO.getPageSize());
        List<SetmealVO> records=setmealMapper.pageQuerySetmealVO(page,setmealPageQueryDTO);
        page.setRecords(records);
        return new PageResult(page.getTotal(), page.getRecords());
    }

    /**
     * Batch delete combo meals (cannot delete combos that are currently being sold)
     * セットメニューの一括削除（販売中のセットは削除不可）
     * @param ids
     */
    @Override
    public void deleteSetmeal(List<Long> ids) {
        ids.forEach(id->{
            Setmeal setmeal = setmealMapper.selectById(id);
            if(setmeal.getStatus() == StatusConstant.ENABLE){
                throw new DeletionNotAllowedException(MessageConstant.SETMEAL_ON_SALE);
            }
        });
        setmealMapper.deleteBatchIds(ids);
        setmealDishMapper.delete(
                new LambdaQueryWrapper<SetmealDish>()
                        .in(SetmealDish::getSetmealId,ids)
        );
    }

    /**
     * Query combo meal and associated dish data by ID
     * IDに基づいてセットメニューと関連料理データを検索
     * 根据id查询套餐和关联的菜品数据
     * @param id
     * @return
     */
    @Override
    public SetmealVO querySetmealById(Long id) {
        Setmeal setmeal = setmealMapper.selectById(id);
        SetmealVO setmealVO = new SetmealVO();
        BeanUtils.copyProperties(setmeal,setmealVO);
        List<SetmealDish> setmealDishes = setmealDishMapper.selectList(
                new LambdaQueryWrapper<SetmealDish>()
                        .eq(SetmealDish::getSetmealId, id)
        );
        setmealVO.setSetmealDishes(setmealDishes);
        return setmealVO;
    }

    /**
     * update setmeal /セットを更新する
     * @param setmealDTO
     */
    @Override
    @Transactional
    public void updateSetmeal(SetmealDTO setmealDTO) {
        Setmeal setmeal = setmealMapper.selectById(setmealDTO.getId());
        BeanUtils.copyProperties(setmealDTO,setmeal);
        setmealMapper.updateById(setmeal);
        Long id = setmealDTO.getId();
        //update dish in the
        setmealDishMapper.delete(
                new LambdaQueryWrapper<SetmealDish>()
                        .eq(SetmealDish::getSetmealId,id)
        );
        List<SetmealDish> setmealDishes = setmealDTO.getSetmealDishes();
        if (setmealDishes != null && !setmealDishes.isEmpty()) {
            setmealDishes.forEach(dish -> dish.setSetmealId(id));
        }
        setmealDishMapper.insert(setmealDishes);
    }

    /**
     * activation/deactivation/セットメニューの販売開始/停止
     * Can deactivate combos that are currently active 販売中のセットメニューを停止可能
     * Can activate combos that are currently inactive 停止中のセットメニューを販売再開可能
     * Active combos are visible to users, inactive ones are hidden 販売中のセットはユーザー側に表示、停止中は非表示
     * Cannot activate if the combo contains any inactive dishes 販売再開時、セット内に停止中の料理が含まれる場合は再開不可
     *
     */
    @Override
    public void startOrStopSet(Long id) {
        Setmeal setmeal = setmealMapper.selectById(id);
        Integer status = setmeal.getStatus();
        if(status==StatusConstant.ENABLE){
            List<Dish> dishList=dishMapper.getBySetmealId(id);
            if(dishList!=null&&dishList.size()>0){
                dishList.forEach(dish -> {
                    if(dish.getStatus()==StatusConstant.DISABLE){
                        throw new DeletionNotAllowedException(MessageConstant.SETMEAL_ENABLE_FAILED);
                    }
                });
            }
        }
        setmeal.setStatus(status==StatusConstant.DISABLE?StatusConstant.ENABLE:StatusConstant.DISABLE);
        setmealMapper.updateById(setmeal);
    }
}




