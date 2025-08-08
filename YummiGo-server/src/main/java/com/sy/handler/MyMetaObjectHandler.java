package com.sy.handler;

import com.baomidou.mybatisplus.core.handlers.MetaObjectHandler;
import com.sy.context.BaseContext;
import org.apache.ibatis.reflection.MetaObject;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class MyMetaObjectHandler implements MetaObjectHandler {

    @Override
    public void insertFill(MetaObject metaObject) {
        LocalDateTime now = LocalDateTime.now();
        Long userId = BaseContext.getCurrentId();

        this.strictInsertFill(metaObject, "createTime", () -> now, LocalDateTime.class);
        this.strictInsertFill(metaObject, "updateTime", () -> now, LocalDateTime.class);
        this.strictInsertFill(metaObject, "createUser", () -> userId, Long.class);
        this.strictInsertFill(metaObject, "updateUser", () -> userId, Long.class);
    }

    @Override
    public void updateFill(MetaObject metaObject) {
        LocalDateTime now = LocalDateTime.now();
        Long userId = BaseContext.getCurrentId();

        this.strictUpdateFill(metaObject, "updateTime", () -> now, LocalDateTime.class);
        this.strictUpdateFill(metaObject, "updateUser", () -> userId, Long.class);
    }
}

