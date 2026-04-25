/*
  # Create AI prompt governance tables for banking assistant

  1. New Objects
    - `current_managed_role()` helper function to resolve the app role from managed_users
    - `ai_prompt_configs` for logical prompt config records (single global prompt)
    - `ai_prompt_versions` for immutable prompt version history and lifecycle states
    - `ai_prompt_reviews` for review decisions and notes
    - `ai_prompt_audit_log` for complete change and decision auditing

  2. Security
    - Enable RLS on all new tables
    - Role-aware policies based on managed user role:
      - viewers can read
      - editors/admins can draft and submit
      - admins can approve/publish/rollback
*/

CREATE OR REPLACE FUNCTION public.current_managed_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT role
  FROM public.managed_users
  WHERE lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.current_managed_role() TO authenticated, anon;

CREATE TABLE IF NOT EXISTS ai_prompt_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  current_published_version_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_prompt_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id uuid NOT NULL REFERENCES ai_prompt_configs(id) ON DELETE CASCADE,
  version_number integer NOT NULL CHECK (version_number > 0),
  prompt_text text NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'in_review', 'approved', 'published', 'rejected', 'archived')),
  change_reason text NOT NULL,
  safety_checklist jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  reviewed_by uuid,
  reviewed_at timestamptz,
  published_by uuid,
  published_at timestamptz,
  parent_version_id uuid REFERENCES ai_prompt_versions(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_prompt_versions_config_version_unique
  ON ai_prompt_versions(config_id, version_number);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_prompt_single_published
  ON ai_prompt_versions(config_id)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_ai_prompt_versions_status_created_at
  ON ai_prompt_versions(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_prompt_versions_config_created_at
  ON ai_prompt_versions(config_id, created_at DESC);

ALTER TABLE ai_prompt_configs
  ADD CONSTRAINT ai_prompt_configs_current_version_fk
  FOREIGN KEY (current_published_version_id) REFERENCES ai_prompt_versions(id);

CREATE TABLE IF NOT EXISTS ai_prompt_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES ai_prompt_versions(id) ON DELETE CASCADE,
  reviewer_id uuid,
  decision text NOT NULL CHECK (decision IN ('approved', 'rejected')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_prompt_reviews_version_created
  ON ai_prompt_reviews(version_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ai_prompt_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id uuid REFERENCES ai_prompt_configs(id) ON DELETE SET NULL,
  version_id uuid REFERENCES ai_prompt_versions(id) ON DELETE SET NULL,
  actor_user_id uuid,
  actor_role text,
  action text NOT NULL,
  reason text,
  before_state jsonb,
  after_state jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_prompt_audit_created_at
  ON ai_prompt_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_prompt_audit_config_created_at
  ON ai_prompt_audit_log(config_id, created_at DESC);

ALTER TABLE ai_prompt_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompt_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompt_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read ai_prompt_configs"
  ON ai_prompt_configs FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow editor+ write ai_prompt_configs"
  ON ai_prompt_configs FOR INSERT TO authenticated
  WITH CHECK (public.current_managed_role() IN ('admin', 'editor'));

CREATE POLICY "Allow editor+ update ai_prompt_configs"
  ON ai_prompt_configs FOR UPDATE TO authenticated
  USING (public.current_managed_role() IN ('admin', 'editor'))
  WITH CHECK (public.current_managed_role() IN ('admin', 'editor'));

CREATE POLICY "Allow authenticated read ai_prompt_versions"
  ON ai_prompt_versions FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow editor+ insert ai_prompt_versions"
  ON ai_prompt_versions FOR INSERT TO authenticated
  WITH CHECK (public.current_managed_role() IN ('admin', 'editor'));

CREATE POLICY "Allow editor+ update ai_prompt_versions"
  ON ai_prompt_versions FOR UPDATE TO authenticated
  USING (public.current_managed_role() IN ('admin', 'editor'))
  WITH CHECK (public.current_managed_role() IN ('admin', 'editor'));

CREATE POLICY "Allow authenticated read ai_prompt_reviews"
  ON ai_prompt_reviews FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow admin insert ai_prompt_reviews"
  ON ai_prompt_reviews FOR INSERT TO authenticated
  WITH CHECK (public.current_managed_role() = 'admin');

CREATE POLICY "Allow authenticated read ai_prompt_audit_log"
  ON ai_prompt_audit_log FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow editor+ insert ai_prompt_audit_log"
  ON ai_prompt_audit_log FOR INSERT TO authenticated
  WITH CHECK (public.current_managed_role() IN ('admin', 'editor'));

INSERT INTO ai_prompt_configs (slug, name, description)
VALUES (
  'global-banking-assistant',
  'Global Banking Assistant Prompt',
  'Single global prompt for the banking conversational assistant.'
)
ON CONFLICT (slug) DO NOTHING;
