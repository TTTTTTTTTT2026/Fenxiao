CREATE TABLE IF NOT EXISTS subordinate_pre_registration_attempt (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    application_id BIGINT NOT NULL,
    reason_code VARCHAR(64) NOT NULL,
    checked_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS registration_claim_mutex (slot_id INT PRIMARY KEY);
INSERT IGNORE INTO registration_claim_mutex (slot_id) VALUES
(0),(1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(11),(12),(13),(14),(15),
(16),(17),(18),(19),(20),(21),(22),(23),(24),(25),(26),(27),(28),(29),(30),(31),
(32),(33),(34),(35),(36),(37),(38),(39),(40),(41),(42),(43),(44),(45),(46),(47),
(48),(49),(50),(51),(52),(53),(54),(55),(56),(57),(58),(59),(60),(61),(62),(63);
