package com.fenxiao.platform.service;

/** Implemented after MCN delivers its paginated, complete directory contract. */
public interface McnGuildDirectoryClient {
    boolean enabled();
    McnGuildDirectorySnapshot fetchCompleteSnapshot(String platformCode);
}
