-- BANDEIRA-only country eligibility. MCN directory facts and existing target rows remain untouched.
CREATE TABLE timo_guild_country_policy (
    guild_id VARCHAR(64) PRIMARY KEY,
    version_no INT NOT NULL,
    updated_by BIGINT NOT NULL,
    updated_at DATETIME NOT NULL
);
CREATE TABLE timo_guild_accepted_country (
    guild_id VARCHAR(64) NOT NULL,
    country_code VARCHAR(10) NOT NULL,
    PRIMARY KEY (guild_id, country_code),
    CONSTRAINT uk_timo_accepted_country UNIQUE (country_code),
    CONSTRAINT fk_timo_country_policy FOREIGN KEY (guild_id) REFERENCES timo_guild_country_policy(guild_id)
);
-- No default expansion: the application inherits the existing MX/ID/BR target configuration until
-- a guild is explicitly saved. A saved empty policy deliberately disables new verifications for it.
