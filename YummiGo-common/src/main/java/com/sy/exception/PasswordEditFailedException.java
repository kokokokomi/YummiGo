package com.sy.exception;

/**
 *パスワード更新エラー
 */
public class PasswordEditFailedException extends BaseException{

    public PasswordEditFailedException(String msg){
        super(msg);
    }

}
