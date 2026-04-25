/*
  # Create System Monitoring Tables

  1. New Tables
    - `system_metrics`
      - `id` (uuid, primary key)
      - `metric_type` (text, not null) - cpu, memory, disk, network
      - `value` (numeric, not null) - percentage or value
      - `unit` (text, not null, default '%') - unit of measurement
      - `metadata` (jsonb, default '{}') - extra context (cores, total_gb, etc.)
      - `recorded_at` (timestamptz, default now()) - when the metric was recorded

    - `system_alerts`
      - `id` (uuid, primary key)
      - `severity` (text, not null) - critical, warning, info
      - `title` (text, not null) - short alert title
      - `message` (text, not null) - detailed description
      - `source` (text, not null) - which subsystem raised it
      - `resolved` (boolean, default false) - whether it has been resolved
      - `resolved_at` (timestamptz) - when it was resolved
      - `created_at` (timestamptz, default now())

    - `error_logs`
      - `id` (uuid, primary key)
      - `level` (text, not null) - error, warn, info
      - `service` (text, not null) - originating service
      - `message` (text, not null)
      - `stack_trace` (text) - optional stack trace
      - `metadata` (jsonb, default '{}')
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on all tables
    - Add anon select/insert policies (generic platform)

  3. Indexes
    - Time-based indexes for efficient querying
    - Type/severity indexes for filtering
*/

-- system_metrics table
CREATE TABLE IF NOT EXISTS system_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type text NOT NULL,
  value numeric NOT NULL,
  unit text NOT NULL DEFAULT '%',
  metadata jsonb DEFAULT '{}',
  recorded_at timestamptz DEFAULT now()
);

ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon select system_metrics"
  ON system_metrics FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon insert system_metrics"
  ON system_metrics FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_system_metrics_type ON system_metrics (metric_type);
CREATE INDEX IF NOT EXISTS idx_system_metrics_recorded ON system_metrics (recorded_at DESC);

-- system_alerts table
CREATE TABLE IF NOT EXISTS system_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  severity text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text NOT NULL,
  source text NOT NULL,
  resolved boolean DEFAULT false,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon select system_alerts"
  ON system_alerts FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon insert system_alerts"
  ON system_alerts FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update system_alerts"
  ON system_alerts FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_system_alerts_severity ON system_alerts (severity);
CREATE INDEX IF NOT EXISTS idx_system_alerts_created ON system_alerts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_alerts_resolved ON system_alerts (resolved);

-- error_logs table
CREATE TABLE IF NOT EXISTS error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level text NOT NULL DEFAULT 'error',
  service text NOT NULL,
  message text NOT NULL,
  stack_trace text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon select error_logs"
  ON error_logs FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon insert error_logs"
  ON error_logs FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update error_logs"
  ON error_logs FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_error_logs_level ON error_logs (level);
CREATE INDEX IF NOT EXISTS idx_error_logs_service ON error_logs (service);
CREATE INDEX IF NOT EXISTS idx_error_logs_created ON error_logs (created_at DESC);