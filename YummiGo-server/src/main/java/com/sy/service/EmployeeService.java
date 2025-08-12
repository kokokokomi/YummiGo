package com.sy.service;

import com.sy.dto.EmployeeDTO;
import com.sy.dto.EmployeeFixPwdDTO;
import com.sy.dto.EmployeeLoginDTO;
import com.sy.dto.EmployeePageQueryDTO;
import com.sy.entity.Employee;
import com.baomidou.mybatisplus.extension.service.IService;
import com.sy.result.PageResult;
import com.sy.result.Result;

/**
* @author kokomi
* @description 针对表【employee(従業員情報)】的数据库操作Service
* @createDate 2025-08-06 22:25:11
*/
public interface EmployeeService extends IService<Employee> {

    Employee login(EmployeeLoginDTO employeeLoginDTO);

    //従業員を新規登録する
    Result addEmployee(EmployeeDTO employeeDTO);

    //従業員のページネーション検索
    PageResult pageQuery(EmployeePageQueryDTO employeePageQueryDTO);

    //disable/enable account/従業員アカウントの状態を更新/启用禁用员工账号
    Result updateStatus(Long id);

    //update employee information
    Result updateEmployee(EmployeeDTO employeeDTO);

    //edit password
    void updatePassword(EmployeeFixPwdDTO dto);

    //delete employee by id
    void deleteEmployee(Long id);
}
