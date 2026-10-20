-- Additive, small metadata only. Existing run/item rows are not scanned or changed.
CREATE TABLE mcn_candidate_snapshot_lock (
    platform_code VARCHAR(32) PRIMARY KEY
);
INSERT INTO mcn_candidate_snapshot_lock(platform_code) VALUES ('TIMO'), ('LINKY');

CREATE TABLE mcn_candidate_snapshot_owner (
    owner_run_id VARCHAR(64) PRIMARY KEY,
    platform_code VARCHAR(32) NOT NULL,
    business_date DATE NOT NULL,
    format_version VARCHAR(32) NOT NULL,
    fingerprint CHAR(64) NOT NULL,
    item_count INT NOT NULL,
    dependency_evidence_gzip LONGBLOB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_mcn_candidate_snapshot_content UNIQUE (platform_code,business_date,format_version,fingerprint),
    CONSTRAINT fk_mcn_snapshot_owner_run FOREIGN KEY (owner_run_id) REFERENCES mcn_income_reward_candidate_run(run_id)
);

CREATE TABLE mcn_candidate_snapshot_ref (
    run_id VARCHAR(64) PRIMARY KEY,
    owner_run_id VARCHAR(64) NOT NULL,
    CONSTRAINT fk_mcn_snapshot_ref_run FOREIGN KEY (run_id) REFERENCES mcn_income_reward_candidate_run(run_id),
    CONSTRAINT fk_mcn_snapshot_ref_owner FOREIGN KEY (owner_run_id) REFERENCES mcn_candidate_snapshot_owner(owner_run_id)
);
