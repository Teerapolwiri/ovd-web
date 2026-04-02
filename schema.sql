-- ===== Overdoze Craft Coffee — Database Schema =====
-- รัน: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS overdoze_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE overdoze_db;

-- ─── Staff Table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    nickname VARCHAR(50),
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    bank_account VARCHAR(50),
    bank_name VARCHAR(100),
    role ENUM(
        'barista',
        'roaster',
        'inventory_lead',
        'admin'
    ) NOT NULL DEFAULT 'barista',
    password VARCHAR(255) NOT NULL,
    status ENUM(
        'pending',
        'approved',
        'rejected'
    ) NOT NULL DEFAULT 'pending',
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─── Sessions (Clock In/Out) Table ─────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(20) PRIMARY KEY,
    staff_id VARCHAR(20) NOT NULL,
    clock_in DATETIME NOT NULL,
    clock_out DATETIME,
    total_break INT DEFAULT 0, -- in minutes
    on_break TINYINT(1) DEFAULT 0,
    break_start DATETIME,
    duration INT, -- in minutes
    is_paid TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff (id) ON DELETE CASCADE
);

-- ─── Indexes ───────────────────────────────────────────────
CREATE INDEX idx_sessions_staff_id ON sessions (staff_id);

CREATE INDEX idx_sessions_clock_in ON sessions (clock_in);

CREATE INDEX idx_staff_email ON staff (email);

CREATE INDEX idx_staff_status ON staff (status);

-- ─── Seed: Default Admin Account ───────────────────────────
-- password: admin123 (bcrypt hash)
INSERT IGNORE INTO
    staff (
        id,
        name,
        email,
        phone,
        role,
        password,
        status
    )
VALUES (
        'admin-001',
        'Admin Overdoze',
        'admin@overdoze.coffee',
        '+66 91 065 6759',
        'admin',
        '$2a$10$RbnF/lMyKMTrvXXM.enfBu.InPp9lELdsReohzzj/qM5ZA4YUcE5y',
        'approved'
    );