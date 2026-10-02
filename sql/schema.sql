-- MySQL-compatible schema (also works on SQLite with minor types)
-- Staging / OLTP-style tables mirroring Excel → MySQL load

CREATE TABLE IF NOT EXISTS users (
  user_id       VARCHAR(10) PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL,
  industry      VARCHAR(50)  NOT NULL,
  role          VARCHAR(80)  NOT NULL,
  company_size  VARCHAR(20)  NOT NULL,
  region        VARCHAR(40)  NOT NULL,
  signup_date   DATE         NOT NULL
);

CREATE TABLE IF NOT EXISTS tools (
  tool_id                 VARCHAR(10) PRIMARY KEY,
  tool_name               VARCHAR(80) NOT NULL,
  category                VARCHAR(40) NOT NULL,
  vendor                  VARCHAR(60) NOT NULL,
  monthly_cost_usd        DECIMAL(8,2) NOT NULL,
  avg_hours_saved_per_use DECIMAL(6,2) NOT NULL,
  license_type            VARCHAR(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS usage_logs (
  log_id           VARCHAR(10) PRIMARY KEY,
  user_id          VARCHAR(10) NOT NULL,
  tool_id          VARCHAR(10) NOT NULL,
  event_date       DATE NOT NULL,
  sessions         INT NOT NULL DEFAULT 0,
  hours_saved      DECIMAL(8,2) NULL,       -- nulls cleaned in pipeline
  session_cost_usd DECIMAL(8,2) NULL,
  status           VARCHAR(20) NOT NULL,
  satisfaction     TINYINT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (tool_id) REFERENCES tools(tool_id)
);

-- Redshift-style star schema (analytics layer)
CREATE TABLE IF NOT EXISTS dim_user (
  user_key      VARCHAR(10) PRIMARY KEY,
  user_name     VARCHAR(100),
  industry      VARCHAR(50),
  role          VARCHAR(80),
  company_size  VARCHAR(20),
  region        VARCHAR(40)
);

CREATE TABLE IF NOT EXISTS dim_tool (
  tool_key          VARCHAR(10) PRIMARY KEY,
  tool_name         VARCHAR(80),
  category          VARCHAR(40),
  vendor            VARCHAR(60),
  monthly_cost_usd  DECIMAL(8,2),
  license_type      VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS dim_date (
  month_key VARCHAR(7) PRIMARY KEY,
  year      INT,
  month     INT,
  quarter   VARCHAR(2)
);

CREATE TABLE IF NOT EXISTS fact_adoption_by_industry_tool (
  industry           VARCHAR(50),
  tool_key           VARCHAR(10),
  tool_name          VARCHAR(80),
  category           VARCHAR(40),
  active_users       INT,
  total_sessions     INT,
  total_hours_saved  DECIMAL(10,2),
  total_cost_usd     DECIMAL(10,2),
  hours_per_dollar   DECIMAL(10,3),
  completion_rate    DECIMAL(5,3)
);

CREATE TABLE IF NOT EXISTS fact_user_metrics (
  user_key              VARCHAR(10) PRIMARY KEY,
  user_name             VARCHAR(100),
  industry              VARCHAR(50),
  role                  VARCHAR(80),
  region                VARCHAR(40),
  company_size          VARCHAR(20),
  tools_used            INT,
  total_sessions        INT,
  total_hours_saved     DECIMAL(10,2),
  total_cost_usd        DECIMAL(10,2),
  roi_hours_per_dollar  DECIMAL(10,3),
  avg_satisfaction      DECIMAL(4,2),
  segment               VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS fact_monthly_industry (
  month_key          VARCHAR(7),
  industry           VARCHAR(50),
  active_users       INT,
  total_sessions     INT,
  total_hours_saved  DECIMAL(10,2),
  total_cost_usd     DECIMAL(10,2)
);

CREATE TABLE IF NOT EXISTS fact_industry_summary (
  industry           VARCHAR(50) PRIMARY KEY,
  active_users       INT,
  tools_adopted      INT,
  total_sessions     INT,
  total_hours_saved  DECIMAL(10,2),
  total_cost_usd     DECIMAL(10,2),
  hours_per_dollar   DECIMAL(10,3)
);
