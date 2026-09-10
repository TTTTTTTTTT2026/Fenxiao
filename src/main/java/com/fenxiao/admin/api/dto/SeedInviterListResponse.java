package com.fenxiao.admin.api.dto;

import java.util.List;

public record SeedInviterListResponse(List<SeedInviterListItem> items, long total, int page, int size) {
}
