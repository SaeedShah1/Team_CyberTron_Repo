/*
  # Create Feature Flags Table

  1. New Tables
    - `feature_flags`
      - `id` (uuid, primary key) - unique identifier
      - `slug` (text, unique, not null) - machine-readable identifier e.g. 'user_management'
      - `name` (text, not null) - display name
      - `description` (text, default '') - what this feature does
      - `category` (text, not null) - grouping: core, integration, experimental, analytics
      - `enabled` (boolean, default false) - whether the feature is active
      - `icon` (text, default 'Box') - lucide icon name for display
      - `config` (jsonb, default '{}') - feature-specific configuration key-value pairs
      - `required_role` (text, default 'admin') - minimum role needed to use this feature
      - `dependencies` (text[], default '{}') - slugs of features this one depends on
      - `sort_order` (integer, default 0) - display ordering
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `feature_flags` table
    - Add anon select/update/insert policies (generic platform, no auth)

  3. Indexes
    - Unique index on slug
    - Index on category for grouping
    - Index on enabled for quick filtering
*/

CREATE TABLE IF NOT EXISTS feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  category text NOT NULL DEFAULT 'core',
  enabled boolean DEFAULT false,
  icon text DEFAULT 'Box',
  config jsonb DEFAULT '{}',
  required_role text DEFAULT 'admin',
  dependencies text[] DEFAULT '{}',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon select feature_flags"
  ON feature_flags FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon insert feature_flags"
  ON feature_flags FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update feature_flags"
  ON feature_flags FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_feature_flags_category ON feature_flags (category);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags (enabled);
CREATE INDEX IF NOT EXISTS idx_feature_flags_sort ON feature_flags (sort_order);