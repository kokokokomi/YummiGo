package com.sy.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.sy.annotation.AutoFill;
import com.sy.constant.PasswordConstant;
import com.sy.context.BaseContext;
import com.sy.dto.EmployeeDTO;
import com.sy.dto.EmployeeFixPwdDTO;
import com.sy.dto.EmployeeLoginDTO;
import com.sy.dto.EmployeePageQueryDTO;
import com.sy.entity.Employee;
import com.sy.enumeration.OperationType;
import com.sy.result.PageResult;
import com.sy.result.Result;
import com.sy.service.EmployeeService;
import com.sy.mapper.EmployeeMapper;
import com.sy.exception.AccountNotFoundException;
import com.sy.constant.MessageConstant;
import com.sy.exception.PasswordErrorException;
import com.sy.constant.StatusConstant;
import com.sy.exception.AccountLockedException;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.DigestUtils;

import java.time.LocalDateTime;
import java.util.Date;

/**
* @author kokomi
* @description 针对表【employee(従業員情報)】的数据库操作Service实现
* @createDate 2025-08-06 22:25:11
*/
@Service
public class EmployeeServiceImpl extends ServiceImpl<EmployeeMapper, Employee>
    implements EmployeeService{
    @Autowired
    private EmployeeMapper employeeMapper;

    @Override
    public Employee login(EmployeeLoginDTO employeeLoginDTO) {
        String username = employeeLoginDTO.getUsername();
        String password = employeeLoginDTO.getPassword();

        LambdaQueryWrapper<Employee> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(Employee::getUsername, username);

        Employee employee = employeeMapper.selectOne(queryWrapper);

        if (employee == null) {
            throw new AccountNotFoundException(MessageConstant.ACCOUNT_NOT_FOUND);
        }
        //MD5digest
        password = DigestUtils.md5DigestAsHex(password.getBytes());

        if (!password.equals(employee.getPassword())) {
            //wrong pwd
            throw new PasswordErrorException(MessageConstant.PASSWORD_ERROR);
        }

        if (employee.getStatus() == StatusConstant.DISABLE) {
            //locked account
            throw new AccountLockedException(MessageConstant.ACCOUNT_LOCKED);
        }
        return employee;
    }

    @Override
    public Result addEmployee(EmployeeDTO employeeDTO) {
        Employee employee = new Employee();
        BeanUtils.copyProperties(employeeDTO, employee);//copy
        employee.setStatus(StatusConstant.ENABLE);
        employee.setPassword(DigestUtils.md5DigestAsHex(PasswordConstant.DEFAULT_PASSWORD.getBytes()));
        employee.setCreateTime(LocalDateTime.now());
        employee.setUpdateTime(LocalDateTime.now());
        //threadlocal get userid
        employee.setCreateUser(BaseContext.getCurrentId());
        employee.setUpdateUser(BaseContext.getCurrentId());
        employeeMapper.insert(employee);
        return Result.success();
    }

    @Override
    @Transactional
    public PageResult pageQuery(EmployeePageQueryDTO employeePageQueryDTO) {

        Page<Employee> page = new Page<>(employeePageQueryDTO.getPage(), employeePageQueryDTO.getPageSize());
        LambdaQueryWrapper<Employee> queryWrapper = new LambdaQueryWrapper<>();
        if (StringUtils.isNotBlank(employeePageQueryDTO.getName())) {
            queryWrapper.like(Employee::getName, employeePageQueryDTO.getName());
        }
        queryWrapper.orderByDesc(Employee::getCreateTime);
        employeeMapper.selectPage(page, queryWrapper);

        PageResult pageResult = new PageResult();
        pageResult.setTotal(page.getTotal());
        pageResult.setRecords(page.getRecords());
        return pageResult;
    }

    /**
     *disable/enable account/従業員アカウントの状態を更新/启用禁用员工账号
     * @param id
     * @return
     */
    @Override
//    @AutoFill(value = OperationType.UPDATE)
    public Result updateStatus(Long id) {
        Employee employee = employeeMapper.selectById(id);

        employee.setStatus(employee.getStatus() == StatusConstant.DISABLE?StatusConstant.ENABLE:StatusConstant.DISABLE);

        employeeMapper.updateById(employee);
        return Result.success();
    }

    @Override
//    @AutoFill(value = OperationType.UPDATE)
    public Result updateEmployee(EmployeeDTO employeeDTO) {
        Employee employee=new Employee();
        BeanUtils.copyProperties(employeeDTO,employee);
//        employee.setUpdateTime(LocalDateTime.now());
//        employee.setUpdateUser(BaseContext.getCurrentId());
        employeeMapper.updateById(employee);
        return Result.success();
    }

    /**
     *Change Password - Verify if entered old password matches original password
     * パスワード変更 - 入力された旧パスワードが元のパスワードと一致するか検証
     * @param dto
     */
    @Override
    public void updatePassword(EmployeeFixPwdDTO dto) {
        String oldPwd = DigestUtils.md5DigestAsHex(dto.getOldPwd().getBytes());
        Long id = BaseContext.getCurrentId();
        Employee employee = employeeMapper.selectById(id);
        String password = employee.getPassword();
        if(!oldPwd.equals(password)){
            throw new PasswordErrorException(MessageConstant.PASSWORD_ERROR);
        }
        String newPwd = DigestUtils.md5DigestAsHex(dto.getNewPwd().getBytes());
        employee.setPassword(newPwd);
        employeeMapper.updateById(employee);
    }

    /**
     * delete employee by id
     * @param id
     */
    @Override
    public void deleteEmployee(Long id) {
        employeeMapper.deleteById(id);
    }

}




