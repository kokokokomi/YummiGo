package com.sy.aspect;

import com.sy.annotation.AutoFill;
import com.sy.constant.AutoFillConstant;
import com.sy.context.BaseContext;
import com.sy.enumeration.OperationType;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.annotation.Pointcut;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.time.LocalDateTime;

/**
 * Custom Aspect for auto-filling common fields
 * 共通フィールド自動設定用カスタムアスペクト
 * 自定义切面，实现公共字段自动填充处理
 */
@Component
@Slf4j
@Aspect
public class AutoFillAspect {

    //aspect point cut
    @Pointcut("execution(* com.sy.service.impl.*.*(..)) && @annotation(com.sy.annotation.AutoFill)")
    public void autoFillPointCut() {}

    @Before("autoFillPointCut()")
    public void autofill(JoinPoint joinPoint) {
        log.info("autofill begin");
        MethodSignature signature= (MethodSignature) joinPoint.getSignature();
        AutoFill annotation = signature.getMethod().getAnnotation(AutoFill.class);//get annotation object on method
        OperationType value = annotation.value();//sql operation type

        Object[] args = joinPoint.getArgs();
        if(args ==null || args.length==0){
            return;
        }
        Object entity=args[0];
        LocalDateTime now = LocalDateTime.now();
        Long currentId = BaseContext.getCurrentId();
        if(value==OperationType.INSERT){
            try {
                Method setCreateTime = entity.getClass().getDeclaredMethod(AutoFillConstant.SET_CREATE_TIME, LocalDateTime.class);
                Method setUpdateTime = entity.getClass().getDeclaredMethod(AutoFillConstant.SET_UPDATE_TIME, LocalDateTime.class);
                Method setCreateUser = entity.getClass().getDeclaredMethod(AutoFillConstant.SET_CREATE_USER, Long.class);
                Method setUpdateUser = entity.getClass().getDeclaredMethod(AutoFillConstant.SET_UPDATE_USER, Long.class);
                //Set field value via reflection/リフレクションでフィールドに値を設定
                setCreateTime.invoke(entity,now);
                setUpdateTime.invoke(entity,now);
                setCreateUser.invoke(entity,currentId);
                setUpdateUser.invoke(entity,currentId);

            } catch (Exception e) {
                throw new RuntimeException(e);
            }

        }else if(value==OperationType.UPDATE){
            try {
                Method setUpdateTime = entity.getClass().getDeclaredMethod(AutoFillConstant.SET_UPDATE_TIME, LocalDateTime.class);
                Method setUpdateUser = entity.getClass().getDeclaredMethod(AutoFillConstant.SET_UPDATE_USER, Long.class);
                //Set field value via reflection/リフレクションでフィールドに値を設定
                setUpdateTime.invoke(entity,now);
                setUpdateUser.invoke(entity,currentId);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }


    }

}
