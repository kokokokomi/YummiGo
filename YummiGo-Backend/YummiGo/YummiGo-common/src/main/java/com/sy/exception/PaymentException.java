package com.sy.exception;

public class PaymentException extends BaseException {
    public PaymentException() {
        super();
    }
    
    public PaymentException(String msg) {
        super(msg);
    }
}