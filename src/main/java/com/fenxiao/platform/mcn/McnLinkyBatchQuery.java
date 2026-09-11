package com.fenxiao.platform.mcn;

import java.util.List;

public record McnLinkyBatchQuery(String platform, List<Subject> subjects) {
    public record Subject(String subjectId, String expectedGuildId) {}
}
