ALTER TABLE platform_guild_directory ADD COLUMN country VARCHAR(64);
ALTER TABLE platform_guild_directory ADD COLUMN mcn_record_updated_at TIMESTAMP NULL;
ALTER TABLE platform_guild_sync_run ADD COLUMN directory_scope VARCHAR(64);
ALTER TABLE platform_guild_sync_run ADD COLUMN snapshot_id VARCHAR(255);
ALTER TABLE platform_guild_sync_run ADD COLUMN snapshot_checksum VARCHAR(255);
ALTER TABLE platform_guild_sync_run ADD COLUMN snapshot_at TIMESTAMP NULL;
ALTER TABLE platform_guild_sync_run ADD COLUMN snapshot_expires_at TIMESTAMP NULL;
