CREATE TABLE invitation_points_manual_adjustment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    request_id VARCHAR(64) NOT NULL,
    user_id BIGINT NOT NULL,
    platform_code VARCHAR(32) NOT NULL,
    delta_points DECIMAL(24,6) NOT NULL,
    reason VARCHAR(128) NOT NULL,
    actor_id BIGINT NOT NULL,
    before_available DECIMAL(24,6) NOT NULL,
    after_available DECIMAL(24,6) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    UNIQUE KEY uk_manual_points_request (request_id),
    INDEX idx_manual_points_user_platform (user_id, platform_code, id)
);

INSERT INTO point_currency_country(country_code,currency_code) VALUES
('CO','COP'),('CL','CLP'),('VE','VES'),('PE','PEN');
