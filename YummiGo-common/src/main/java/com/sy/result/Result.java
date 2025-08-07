package com.sy.result;

import com.sy.enumeration.ResultCodeEnum;
import lombok.Data;

import java.io.Serializable;

/**
 * Unified backend response object
 * @param <T>
 */
@Data
public class Result<T> implements Serializable {

    private Integer code; //code：1 success，0 and other num failed
    private String message; //error msg
    private T data; //data
//    public Result(){}
    protected static <T> Result<T> build(T data) {
        Result<T> result = new Result<T>();
        if (data != null)
            result.setData(data);
        return result;
    }
    public static <T> Result<T> build(T body, Integer code, String message) {
        Result<T> result = build(body);
        result.setCode(code);
        result.setMessage(message);
        return result;
    }
    public static <T> Result<T> build(T body, ResultCodeEnum resultCodeEnum) {
        Result<T> result = build(body);
        result.setCode(resultCodeEnum.getCode());
        result.setMessage(resultCodeEnum.getMessage());
        return result;
    }
/*    public static<T> Result<T> success(T data){
        Result<T> result = build(data);
        return build(data, ResultCodeEnum.SUCCESS);
    }*/
    public Result<T> message(String msg){
        this.setMessage(msg);
        return this;
    }
    public Result<T> code(Integer code){
        this.setCode(code);
        return this;
    }
   public static <T> Result<T> success() {
        Result<T> result = new Result<T>();
        result.code = 1;
        return result;
    }
    public static <T> Result<T> success(T object) {
        Result<T> result = new Result<T>();
        result.data = object;
        result.code = 1;
        return result;
    }

    public static <T> Result<T> error(String msg) {
        Result result = new Result();
        result.message = msg;
        result.code = 0;
        return result;
    }

}
