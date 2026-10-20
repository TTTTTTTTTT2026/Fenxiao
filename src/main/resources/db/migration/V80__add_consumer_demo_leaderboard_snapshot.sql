-- Public design/demo data only. No real user, points, reward, currency-rate or payment links.
CREATE TABLE consumer_demo_leaderboard_snapshot (
    as_of_date DATE PRIMARY KEY,
    generator_version VARCHAR(32) NOT NULL,
    published_at TIMESTAMP(6) NOT NULL,
    payload MEDIUMTEXT NOT NULL
);
