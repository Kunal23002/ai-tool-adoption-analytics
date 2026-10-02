-- Load raw CSVs into SQLite for a local MySQL-style demo.
-- Usage:
--   sqlite3 data/adoption_oltp.db < sql/seed_sqlite.sql
-- (Run from repo root; paths are relative to cwd.)

.mode csv
.headers on

DROP TABLE IF EXISTS usage_logs;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS tools;

CREATE TABLE users (
  user_id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT,
  industry TEXT,
  role TEXT,
  company_size TEXT,
  region TEXT,
  signup_date TEXT
);

CREATE TABLE tools (
  tool_id TEXT PRIMARY KEY,
  tool_name TEXT,
  category TEXT,
  vendor TEXT,
  monthly_cost_usd REAL,
  avg_hours_saved_per_use REAL,
  license_type TEXT
);

CREATE TABLE usage_logs (
  log_id TEXT PRIMARY KEY,
  user_id TEXT,
  tool_id TEXT,
  event_date TEXT,
  sessions INTEGER,
  hours_saved REAL,
  session_cost_usd REAL,
  status TEXT,
  satisfaction INTEGER
);

.import --skip 1 data/raw/users.csv users
.import --skip 1 data/raw/tools.csv tools
.import --skip 1 data/raw/usage_logs.csv usage_logs
