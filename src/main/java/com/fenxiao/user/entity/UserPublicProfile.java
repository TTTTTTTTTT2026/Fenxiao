package com.fenxiao.user.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

@Entity
@Table(name = "user_public_profile")
public class UserPublicProfile {
    @Id
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "nickname", length = 40)
    private String nickname;

    @Column(name = "avatar_media_type", length = 32)
    private String avatarMediaType;

    @Lob
    @Column(name = "avatar_data")
    private byte[] avatarData;

    protected UserPublicProfile() { }

    public static UserPublicProfile forUser(long userId) {
        UserPublicProfile profile = new UserPublicProfile();
        profile.userId = userId;
        return profile;
    }

    public Long getUserId() { return userId; }
    public String getNickname() { return nickname; }
    public String getAvatarMediaType() { return avatarMediaType; }
    public byte[] getAvatarData() { return avatarData; }
    public void setNickname(String nickname) { this.nickname = nickname; }
    public void setAvatar(String mediaType, byte[] data) {
        this.avatarMediaType = mediaType;
        this.avatarData = data;
    }
}
