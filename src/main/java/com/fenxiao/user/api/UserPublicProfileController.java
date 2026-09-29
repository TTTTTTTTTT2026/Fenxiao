package com.fenxiao.user.api;

import com.fenxiao.common.security.DistributionAccessGuard;
import com.fenxiao.user.service.UserPublicProfileService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/distribution/public-profiles/{userId}")
public class UserPublicProfileController {
    private final DistributionAccessGuard access;
    private final UserPublicProfileService profiles;

    public UserPublicProfileController(DistributionAccessGuard access, UserPublicProfileService profiles) {
        this.access = access;
        this.profiles = profiles;
    }

    @GetMapping
    public UserPublicProfileService.ProfileView get(@PathVariable long userId,
                                                      @RequestHeader("X-Distribution-Token") String token) {
        access.assertUserAccess(userId, token);
        return profiles.get(userId);
    }

    @PostMapping("/nickname")
    public UserPublicProfileService.ProfileView nickname(@PathVariable long userId,
                                                           @RequestHeader("X-Distribution-Token") String token,
                                                           @RequestBody NicknameRequest request) {
        access.assertUserAccess(userId, token);
        return profiles.updateNickname(userId, request.nickname());
    }

    @PostMapping("/avatar")
    public UserPublicProfileService.ProfileView avatar(@PathVariable long userId,
                                                         @RequestHeader("X-Distribution-Token") String token,
                                                         @RequestBody AvatarRequest request) {
        access.assertUserAccess(userId, token);
        return profiles.updateAvatar(userId, request.dataUrl());
    }

    public record NicknameRequest(String nickname) { }
    public record AvatarRequest(String dataUrl) { }
}
