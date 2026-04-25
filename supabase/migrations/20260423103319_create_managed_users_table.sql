/*
  # Create Managed Users Table

  1. New Tables
    - `managed_users`
      - `id` (uuid, primary key) - unique identifier for each managed user
      - `username` (text, not null) - display name of the user
      - `email` (text, unique, not null) - email address
      - `role` (text, not null, default 'viewer') - user role (admin, editor, viewer)
      - `status` (text, not null, default 'active') - account status (active, inactive, suspended)
      - `last_login` (timestamptz) - timestamp of last login
      - `created_at` (timestamptz, default now()) - creation timestamp
      - `updated_at` (timestamptz, default now()) - last update timestamp

  2. Security
    - Enable RLS on `managed_users` table
    - Add policy for anon users to perform all CRUD operations (generic platform, no auth required)

  3. Notes
    - This is a generic user management table for platform administration
    - Roles and statuses are text-based for flexibility across use cases
*/

CREATE TABLE IF NOT EXISTS managed_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'viewer',
  status text NOT NULL DEFAULT 'active',
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE managed_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon select managed_users"
  ON managed_users FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon insert managed_users"
  ON managed_users FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update managed_users"
  ON managed_users FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon delete managed_users"
  ON managed_users FOR DELETE
  TO anon
  USING (true);

CREATE INDEX IF NOT EXISTS idx_managed_users_role ON managed_users (role);
CREATE INDEX IF NOT EXISTS idx_managed_users_status ON managed_users (status);
CREATE INDEX IF NOT EXISTS idx_managed_users_email ON managed_users (email);