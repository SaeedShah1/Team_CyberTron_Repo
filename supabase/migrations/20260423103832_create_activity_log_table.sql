/*
  # Create Activity Log Table

  1. New Tables
    - `activity_log`
      - `id` (uuid, primary key) - unique identifier
      - `user_id` (uuid, foreign key) - references managed_users
      - `action` (text, not null) - action type: created, updated, deleted, login, role_changed, status_changed
      - `description` (text, not null) - human-readable description of the action
      - `metadata` (jsonb, default '{}') - additional context data
      - `created_at` (timestamptz, default now()) - when the action occurred

  2. Security
    - Enable RLS on `activity_log` table
    - Add policies for anon access (generic platform, no auth required)

  3. Indexes
    - Index on created_at for time-based queries
    - Index on user_id for user-specific queries
    - Index on action for filtering by action type
*/

CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES managed_users(id) ON DELETE SET NULL,
  action text NOT NULL,
  description text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon select activity_log"
  ON activity_log FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon insert activity_log"
  ON activity_log FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log (user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log (action);