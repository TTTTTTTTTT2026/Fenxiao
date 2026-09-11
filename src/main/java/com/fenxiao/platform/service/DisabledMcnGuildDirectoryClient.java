package com.fenxiao.platform.service;

/** Safe default until MCN's authoritative directory API and credentials are available. */
public class DisabledMcnGuildDirectoryClient implements McnGuildDirectoryClient {
    @Override public boolean enabled() { return false; }
    @Override public McnGuildDirectorySnapshot fetchCompleteSnapshot(String platformCode) {
        throw new IllegalStateException("MCN guild directory synchronization is not configured");
    }
}
