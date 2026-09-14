ALTER TABLE mcn_income_delivery_receipt
    ADD COLUMN fact_evidence_hash VARCHAR(64) NULL AFTER payload_hash;
