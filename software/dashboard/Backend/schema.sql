CREATE TABLE IF NOT EXISTS axle_temperature_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    train_id VARCHAR(50) NOT NULL,
    coach_id VARCHAR(50) NOT NULL,
    axle_id VARCHAR(50) NOT NULL,
    temperature NUMERIC(6, 2) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('NORMAL', 'WARNING', 'CRITICAL'))
);

CREATE INDEX IF NOT EXISTS idx_axle_temperature_logs_timestamp
    ON axle_temperature_logs (timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_axle_temperature_logs_status
    ON axle_temperature_logs (status);

CREATE INDEX IF NOT EXISTS idx_axle_temperature_logs_train_coach_axle
    ON axle_temperature_logs (train_id, coach_id, axle_id);
