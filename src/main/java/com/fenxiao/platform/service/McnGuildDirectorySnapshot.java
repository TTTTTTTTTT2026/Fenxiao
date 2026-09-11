package com.fenxiao.platform.service;

import com.fenxiao.platform.entity.McnGuildDirectoryItem;
import java.util.List;

/** A snapshot may mark prior guilds missing only when MCN confirms it is complete for one platform. */
public record McnGuildDirectorySnapshot(String platformCode, boolean complete, String sourceVersion,
                                       List<McnGuildDirectoryItem> items) {}
