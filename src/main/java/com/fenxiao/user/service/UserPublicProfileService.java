package com.fenxiao.user.service;

import com.fenxiao.user.entity.UserPublicProfile;
import com.fenxiao.user.repository.UserDistributionProfileRepository;
import com.fenxiao.user.repository.UserPublicProfileRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.Iterator;

@Service
@Transactional
public class UserPublicProfileService {
    private static final int MAX_AVATAR_BYTES = 1024 * 1024;
    private final UserPublicProfileRepository profiles;
    private final UserDistributionProfileRepository users;

    public UserPublicProfileService(UserPublicProfileRepository profiles, UserDistributionProfileRepository users) {
        this.profiles = profiles;
        this.users = users;
    }

    public ProfileView get(long userId) {
        requireUser(userId);
        return profiles.findById(userId).map(this::view).orElse(new ProfileView(null, null));
    }

    public ProfileView updateNickname(long userId, String value) {
        String nickname = value == null ? "" : value.strip();
        if (nickname.isEmpty() || nickname.codePointCount(0, nickname.length()) > 24 || nickname.length() > 40
                || nickname.codePoints().anyMatch(Character::isISOControl)) {
            throw new IllegalArgumentException("nickname must be 1-24 characters without control characters");
        }
        UserPublicProfile profile = getOrCreate(userId);
        profile.setNickname(nickname);
        return view(profiles.save(profile));
    }

    public ProfileView updateAvatar(long userId, String dataUrl) {
        if (dataUrl == null || dataUrl.length() > 1500000 || !dataUrl.matches("(?s)^data:image/(png|jpeg);base64,[A-Za-z0-9+/=]+$")) {
            throw new IllegalArgumentException("avatar must be a PNG or JPEG image up to 1 MB");
        }
        String mediaType = dataUrl.startsWith("data:image/png;") ? "image/png" : "image/jpeg";
        byte[] bytes;
        try {
            bytes = Base64.getDecoder().decode(dataUrl.substring(dataUrl.indexOf(',') + 1));
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("invalid avatar image");
        }
        if (bytes.length == 0 || bytes.length > MAX_AVATAR_BYTES || !matchesSignature(mediaType, bytes)) {
            throw new IllegalArgumentException("avatar must be a PNG or JPEG image up to 1 MB");
        }
        validateImage(bytes);
        UserPublicProfile profile = getOrCreate(userId);
        profile.setAvatar(mediaType, bytes);
        return view(profiles.save(profile));
    }

    private void validateImage(byte[] bytes) {
        try (ImageInputStream input = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
            Iterator<ImageReader> readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) throw new IllegalArgumentException("invalid avatar image");
            ImageReader reader = readers.next();
            try {
                reader.setInput(input);
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                if (width < 1 || height < 1 || width > 2048 || height > 2048) {
                    throw new IllegalArgumentException("avatar dimensions must be at most 2048 x 2048");
                }
                if (reader.read(0) == null) throw new IllegalArgumentException("invalid avatar image");
            } finally {
                reader.dispose();
            }
        } catch (IOException exception) {
            throw new IllegalArgumentException("invalid avatar image");
        }
    }

    private boolean matchesSignature(String mediaType, byte[] bytes) {
        if ("image/png".equals(mediaType)) {
            return bytes.length >= 8 && (bytes[0] & 255) == 137 && bytes[1] == 80 && bytes[2] == 78 && bytes[3] == 71
                    && bytes[4] == 13 && bytes[5] == 10 && bytes[6] == 26 && bytes[7] == 10;
        }
        return bytes.length >= 4 && (bytes[0] & 255) == 255 && (bytes[1] & 255) == 216
                && (bytes[bytes.length - 2] & 255) == 255 && (bytes[bytes.length - 1] & 255) == 217;
    }

    private UserPublicProfile getOrCreate(long userId) {
        requireUser(userId);
        return profiles.findById(userId).orElseGet(() -> UserPublicProfile.forUser(userId));
    }

    private void requireUser(long userId) {
        if (!users.existsById(userId)) throw new IllegalArgumentException("user not found");
    }

    private ProfileView view(UserPublicProfile profile) {
        byte[] data = profile.getAvatarData();
        String avatar = data == null ? null : "data:" + profile.getAvatarMediaType() + ";base64," + Base64.getEncoder().encodeToString(data);
        return new ProfileView(profile.getNickname(), avatar);
    }

    public record ProfileView(String nickname, String avatarDataUrl) { }
}
