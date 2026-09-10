package com.fenxiao.platform.mcn;

import java.util.List;

public record McnTimoBatchQuery(String platform, String lookupMode, List<Subject> subjects) {
    public record Subject(String subjectId, String expectedGuildId, String expectedCountry) {}
}
