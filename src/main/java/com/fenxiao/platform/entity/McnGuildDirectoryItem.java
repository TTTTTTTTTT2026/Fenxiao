package com.fenxiao.platform.entity;

import java.time.LocalDateTime;

/** A validated MCN directory item. It deliberately contains no BANDEIRA invitation-chain decision. */
public record McnGuildDirectoryItem(String guildId, String guildName, String guildStatus, String country,
                                   LocalDateTime recordUpdatedAt, LocalDateTime officialUpdatedAt,
                                   String sourceVersion, String joinInstruction) {}
