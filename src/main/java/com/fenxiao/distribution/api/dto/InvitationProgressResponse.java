package com.fenxiao.distribution.api.dto;

import java.util.List;

public record InvitationProgressResponse(String platformCode, List<Item> items, int page, int size,
                                         long total, boolean hasMore) {
    public record Item(Long userId, String maskedPhone, String registeredAt, String bindingStatus) {}
}
