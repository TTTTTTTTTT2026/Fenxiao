package com.fenxiao.distribution.api.dto;

import java.util.List;

public record EffectiveTeamResponse(List<Item> items, long total) {
    public record Item(long userId, String countryCode, int level) { }
}
