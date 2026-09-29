CREATE TABLE user_public_profile (
    user_id BIGINT PRIMARY KEY,
    nickname VARCHAR(40) NULL,
    avatar_media_type VARCHAR(32) NULL,
    avatar_data LONGBLOB NULL
);
