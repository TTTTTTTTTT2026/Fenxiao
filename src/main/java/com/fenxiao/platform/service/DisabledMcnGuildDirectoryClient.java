package com.fenxiao.platform.service;

import org.springframework.stereotype.Service;

/** Safe default until MCN's authoritative directory API and credentials are available. */
@Service
public class DisabledMcnGuildDirectoryClient implements McnGuildDirectoryClient {
    @Override public boolean enabled() { return false; }
    @Override public McnGuildDirectorySnapshot fetchCompleteSnapshot(String platformCode) {
        throw new IllegalStateException("MCN guild directory synchronization is not configured");
    }
}
