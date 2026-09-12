ALTER TABLE mcn_income_delivery_receipt
    ADD COLUMN platform_code VARCHAR(32) NULL,
    ADD COLUMN snapshot_at TIMESTAMP NULL,
    ADD COLUMN source_watermark LONGTEXT NULL;

ALTER TABLE mcn_income_raw_ledger_event
    ADD COLUMN fact_granularity VARCHAR(32) NULL,
    ADD COLUMN settlement_basis VARCHAR(64) NULL,
    ADD COLUMN amount_unit VARCHAR(32) NULL,
    ADD COLUMN business_date DATE NULL,
    ADD COLUMN source_timezone VARCHAR(64) NULL,
    ADD COLUMN period_start TIMESTAMP NULL,
    ADD COLUMN period_end TIMESTAMP NULL;

CREATE INDEX idx_mcn_income_raw_business_day
    ON mcn_income_raw_ledger_event(platform_code, business_date, guild_id, settlement_status);
