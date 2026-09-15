ALTER TABLE mcn_income_sync_checkpoint
    ADD COLUMN next_attempt_at TIMESTAMP NULL;
