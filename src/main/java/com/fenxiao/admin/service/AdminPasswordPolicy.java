package com.fenxiao.admin.service;

import org.springframework.stereotype.Component;
import java.util.Set;

@Component
public class AdminPasswordPolicy {
    private static final Set<String> BLOCKED=Set.of("password123!","admin123456!","qwerty123456!","1234567890Aa!");
    public void validate(String username,String password){
        if(password==null||password.length()<8||password.length()>128)throw new IllegalArgumentException("password must be 8-128 characters");
        if(username!=null&&password.toLowerCase().contains(username.toLowerCase()))throw new IllegalArgumentException("password must not contain username");
        if(!password.chars().anyMatch(c -> (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z'))||!password.chars().anyMatch(Character::isDigit))throw new IllegalArgumentException("password must contain English letters and numbers");
        if(BLOCKED.contains(password.toLowerCase()))throw new IllegalArgumentException("password is too common");
    }
}
