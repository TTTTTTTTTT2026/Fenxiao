CREATE TABLE sms_delivery_control (
    id BIGINT PRIMARY KEY,
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    updated_by BIGINT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO sms_delivery_control (id, enabled, updated_by, updated_at)
VALUES (1, FALSE, NULL, UTC_TIMESTAMP());
