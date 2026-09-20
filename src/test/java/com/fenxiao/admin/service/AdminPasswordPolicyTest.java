package com.fenxiao.admin.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AdminPasswordPolicyTest {
    private final AdminPasswordPolicy policy = new AdminPasswordPolicy();

    @Test
    void acceptsEightCharactersWithLettersAndNumbers() {
        assertThatCode(() -> policy.validate("operator", "abc12345")).doesNotThrowAnyException();
        assertThatCode(() -> policy.validate("operator", "ABCD9876")).doesNotThrowAnyException();
    }

    @Test
    void rejectsPasswordsWithoutEightCharactersLettersOrNumbers() {
        assertThatThrownBy(() -> policy.validate("operator", "abc1234")).hasMessage("password must be 8-128 characters");
        assertThatThrownBy(() -> policy.validate("operator", "abcdefgh")).hasMessage("password must contain English letters and numbers");
        assertThatThrownBy(() -> policy.validate("operator", "12345678")).hasMessage("password must contain English letters and numbers");
        assertThatThrownBy(() -> policy.validate("operator", "密码123456")).hasMessage("password must contain English letters and numbers");
    }
}
