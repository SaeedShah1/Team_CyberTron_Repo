/*
  # Add authenticated role RLS policies to all tables

  Previously all policies targeted `anon` only. After adding login,
  the Supabase client sends requests as `authenticated`, which had
  no matching policies, so all data was invisible.

  This migration adds authenticated-role policies mirroring the
  existing anon policies for every public table:

  1. managed_users  -- SELECT, INSERT, UPDATE, DELETE
  2. activity_log   -- SELECT, INSERT
  3. system_metrics  -- SELECT, INSERT
  4. system_alerts   -- SELECT, INSERT, UPDATE
  5. error_logs      -- SELECT, INSERT, UPDATE
  6. products        -- SELECT, INSERT, UPDATE, DELETE
  7. feature_flags   -- SELECT, INSERT, UPDATE
*/

-- managed_users
CREATE POLICY "Allow authenticated select managed_users"
  ON managed_users FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated insert managed_users"
  ON managed_users FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated update managed_users"
  ON managed_users FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated delete managed_users"
  ON managed_users FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- activity_log
CREATE POLICY "Allow authenticated select activity_log"
  ON activity_log FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated insert activity_log"
  ON activity_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- system_metrics
CREATE POLICY "Allow authenticated select system_metrics"
  ON system_metrics FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated insert system_metrics"
  ON system_metrics FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- system_alerts
CREATE POLICY "Allow authenticated select system_alerts"
  ON system_alerts FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated insert system_alerts"
  ON system_alerts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated update system_alerts"
  ON system_alerts FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- error_logs
CREATE POLICY "Allow authenticated select error_logs"
  ON error_logs FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated insert error_logs"
  ON error_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated update error_logs"
  ON error_logs FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- products
CREATE POLICY "Allow authenticated select products"
  ON products FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated insert products"
  ON products FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated update products"
  ON products FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated delete products"
  ON products FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- feature_flags
CREATE POLICY "Allow authenticated select feature_flags"
  ON feature_flags FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated insert feature_flags"
  ON feature_flags FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated update feature_flags"
  ON feature_flags FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
