CREATE TABLE point_currency_country (
    country_code VARCHAR(2) PRIMARY KEY,
    currency_code VARCHAR(3) NOT NULL
);

INSERT INTO point_currency_country(country_code,currency_code) VALUES
('CN','CNY'),('ID','IDR'),('MX','MXN'),('BR','BRL'),('HK','HKD');

-- Reference valuation only. No default prices and no writes to any points/payment ledger.
CREATE TABLE point_currency_rate_version (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    country_code VARCHAR(2) NOT NULL,
    version_no INT NOT NULL,
    currency_per_point DECIMAL(20,8) NULL,
    enabled BOOLEAN NOT NULL,
    effective_at TIMESTAMP(6) NOT NULL,
    cancelled BOOLEAN NOT NULL DEFAULT FALSE,
    cancelled_at TIMESTAMP(6) NULL,
    cancelled_by BIGINT NULL,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    UNIQUE KEY uk_point_currency_version(country_code,version_no),
    INDEX idx_point_currency_effective(country_code,cancelled,effective_at,version_no),
    CONSTRAINT fk_point_currency_country FOREIGN KEY(country_code) REFERENCES point_currency_country(country_code),
    CONSTRAINT ck_point_currency_enabled_rate CHECK(enabled=FALSE OR (currency_per_point IS NOT NULL AND currency_per_point>0))
);
