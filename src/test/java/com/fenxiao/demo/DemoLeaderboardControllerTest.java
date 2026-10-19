package com.fenxiao.demo;

import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class DemoLeaderboardControllerTest {
    @Test void publicReadIsClearlyDemoAndDoesNotPublishOrAcceptWrites() throws Exception {
        var service = mock(DemoLeaderboardService.class); when(service.enabled()).thenReturn(true);
        when(service.latest()).thenReturn(Optional.of(new DemoLeaderboardDtos.Snapshot("DEMO", "USD", LocalDate.of(2026,10,18),
                Instant.parse("2026-10-19T00:10:00Z"), Instant.parse("2026-10-20T00:10:00Z"), false, List.of())));
        var mvc = MockMvcBuilders.standaloneSetup(new DemoLeaderboardController(service)).build();
        mvc.perform(get("/api/public/demo-leaderboard")).andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.mode").value("DEMO")).andExpect(jsonPath("$.currency").value("USD"));
        mvc.perform(post("/api/public/demo-leaderboard")).andExpect(status().isMethodNotAllowed());
        verify(service, never()).publishDue();
    }
    @Test void missingAndDisabledDataNeverReturnInventedSuccess() throws Exception {
        var service = mock(DemoLeaderboardService.class);
        var mvc = MockMvcBuilders.standaloneSetup(new DemoLeaderboardController(service)).build();
        mvc.perform(get("/api/public/demo-leaderboard")).andExpect(status().isNotFound());
        when(service.enabled()).thenReturn(true); when(service.latest()).thenReturn(Optional.empty());
        mvc.perform(get("/api/public/demo-leaderboard")).andExpect(status().isServiceUnavailable());
    }
}
