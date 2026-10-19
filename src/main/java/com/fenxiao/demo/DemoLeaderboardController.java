package com.fenxiao.demo;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class DemoLeaderboardController {
    private final DemoLeaderboardService service;
    public DemoLeaderboardController(DemoLeaderboardService service) { this.service = service; }

    @GetMapping("/api/public/demo-leaderboard")
    public ResponseEntity<DemoLeaderboardDtos.Snapshot> get() {
        if (!service.enabled()) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(service.latest()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Demo leaderboard is not ready")));
    }
}
