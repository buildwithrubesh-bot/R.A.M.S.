CREATE TABLE IF NOT EXISTS temperature_readings (
  id BIGSERIAL PRIMARY KEY,
  coach_no VARCHAR(32) NOT NULL,
  axle_no VARCHAR(32) NOT NULL,
  temperature NUMERIC(5,2) NOT NULL,
  status VARCHAR(16) NOT NULL CHECK (status IN ('NORMAL', 'WARNING', 'CRITICAL')),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_temperature_readings_recorded_at
  ON temperature_readings (recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_temperature_readings_coach_axle_time
  ON temperature_readings (coach_no, axle_no, recorded_at DESC);

CREATE TABLE IF NOT EXISTS alerts (
  id BIGSERIAL PRIMARY KEY,
  coach_no VARCHAR(32) NOT NULL,
  axle_no VARCHAR(32) NOT NULL,
  temperature NUMERIC(5,2) NOT NULL,
  alert_level VARCHAR(16) NOT NULL CHECK (alert_level IN ('WARNING', 'CRITICAL')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_created_at
  ON alerts (created_at DESC);
