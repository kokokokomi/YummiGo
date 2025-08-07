package com.sy.controller.admin;

import com.sy.constant.JwtClaimsConstant;
import com.sy.dto.EmployeeDTO;
import com.sy.dto.EmployeeLoginDTO;
import com.sy.dto.EmployeePageQueryDTO;
import com.sy.entity.Employee;
import com.sy.enumeration.ResultCodeEnum;
import com.sy.properties.JwtProperties;
import com.sy.result.PageResult;
import com.sy.result.Result;
import com.sy.service.EmployeeService;
import com.sy.utils.JwtUtil;
import com.sy.vo.EmployeeLoginVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("admin/employee")
@Slf4j
@Tag(name = "api for employee")
public class EmployeeController {

    @Autowired
    private EmployeeService employeeService;

    @Autowired
    private JwtProperties jwtProperties;
    @GetMapping("hello")
    public void hello() {
        System.out.println("hello");
    }

    @PostMapping("login")
    @Operation(summary = "Employee login")
    public Result<EmployeeLoginVO> login(@RequestBody EmployeeLoginDTO employeeLoginDTO) {
        log.info("従業員ログイン：{}", employeeLoginDTO);
        Employee employee = employeeService.login(employeeLoginDTO);
/*        if(employee == null) {
            return Result.build(null, ResultCodeEnum.PASSWORD_ERROR);
        }*/

        //ユーザーのログイン認証が成功した後、JWTトークンを発行します。
        Map<String, Object> claims = new HashMap<>();
        claims.put(JwtClaimsConstant.EMP_ID, employee.getId());
        String token = JwtUtil.createJWT(
                jwtProperties.getAdminSecretKey(),
                jwtProperties.getAdminTtl(),
                claims);

        EmployeeLoginVO employeeLoginVO = EmployeeLoginVO.builder()
                .id(employee.getId())
                .userName(employee.getUsername())
                .name(employee.getName())
                .token(token)
                .build();

        return Result.success(employeeLoginVO);

    }

    @PostMapping("logout")
    @Operation(summary = "Employee logout")
    public Result<String> logout() {
        return Result.success(null);
    }

    @PostMapping
    @Operation(summary = "add employee")
    public Result addEmployee(@RequestBody EmployeeDTO employeeDTO){
        log.info("add employee:{}", employeeDTO);
        Result result=employeeService.addEmployee(employeeDTO);
        return result;
    }

    /**
     * Retrieve employee list with pagination/従業員のページネーション検索/ 员工分页查询
     * @param employeePageQueryDTO
     * @return
     */
    @GetMapping("page")
    @Operation(summary = "query employee page")
    public Result<PageResult> pageQuery(@ParameterObject EmployeePageQueryDTO employeePageQueryDTO){
        log.info("page:{}", employeePageQueryDTO);
        PageResult result=employeeService.pageQuery(employeePageQueryDTO);
        return Result.success(result);
    }
}
