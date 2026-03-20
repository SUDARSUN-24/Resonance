-- ═══════════════════════════════════════════════
--  RESONANCE — Database Setup
--  Run this ONCE in phpMyAdmin or MySQL CLI
--  to create the database and table
-- ═══════════════════════════════════════════════

-- 1. Create the database
CREATE DATABASE IF NOT EXISTS resonance_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE resonance_db;

-- 2. Create the voice requests table
CREATE TABLE IF NOT EXISTS voice_requests (
    id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    producer_name VARCHAR(120)    NOT NULL DEFAULT '',
    email         VARCHAR(200)    NOT NULL DEFAULT '',
    voice_type    VARCHAR(50)     NOT NULL,
    voice_gender  VARCHAR(10)     NOT NULL DEFAULT 'male',
    language      VARCHAR(20)     NOT NULL DEFAULT 'en-US',
    emotion       VARCHAR(30)     NOT NULL DEFAULT 'neutral',
    speed         DECIMAL(4,2)    NOT NULL DEFAULT 1.00,
    pitch         DECIMAL(4,2)    NOT NULL DEFAULT 1.00,
    text_input    TEXT            NOT NULL,
    char_count    SMALLINT        NOT NULL DEFAULT 0,
    ip_address    VARCHAR(45)         NULL,
    created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Optional: index on email for quick lookups
CREATE INDEX idx_email      ON voice_requests (email);
CREATE INDEX idx_voice_type ON voice_requests (voice_type);
CREATE INDEX idx_created_at ON voice_requests (created_at);

-- ═══════════════════════════════════════════════
--  DONE — you should see resonance_db in phpMyAdmin
--  with the table voice_requests
-- ═══════════════════════════════════════════════