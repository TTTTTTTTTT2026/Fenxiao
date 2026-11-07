CREATE TABLE timo_invitation_artwork (
    locale VARCHAR(2) PRIMARY KEY,
    media_type VARCHAR(24) NOT NULL,
    image_bytes MEDIUMBLOB NOT NULL
);
