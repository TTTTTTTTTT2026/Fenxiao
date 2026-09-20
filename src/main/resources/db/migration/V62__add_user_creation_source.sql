-- Creation source is recorded when a distribution profile is first created.
-- Existing records cannot be safely inferred from incidental fields, so retain an
-- explicit historical state instead of misclassifying them as internal or client-created.
ALTER TABLE user_distribution_profile
    ADD COLUMN creation_source VARCHAR(32) NOT NULL DEFAULT 'HISTORICAL_UNVERIFIED';
