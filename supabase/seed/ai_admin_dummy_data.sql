-- AI Admin Agent dummy data seed script
-- Run in Supabase SQL Editor after migrations are applied.

-- 1) Managed users for role-based authorization
insert into managed_users (username, email, role, status, last_login)
values
  ('Platform Admin', 'admin@platform.io', 'admin', 'active', now() - interval '1 hour'),
  ('Prompt Editor', 'editor@platform.io', 'editor', 'active', now() - interval '3 hour'),
  ('Read Only User', 'viewer@platform.io', 'viewer', 'active', now() - interval '1 day')
on conflict (email) do update
set
  username = excluded.username,
  role = excluded.role,
  status = excluded.status,
  updated_at = now();

-- 2) Ensure global prompt config exists
insert into ai_prompt_configs (slug, name, description)
values (
  'global-banking-assistant',
  'Global Banking Assistant Prompt',
  'Single global prompt for the banking conversational assistant.'
)
on conflict (slug) do nothing;

-- 3) Seed prompt versions in different lifecycle stages
with cfg as (
  select id as config_id from ai_prompt_configs where slug = 'global-banking-assistant' limit 1
),
admin_user as (
  select id as user_id from managed_users where email = 'admin@platform.io' limit 1
),
editor_user as (
  select id as user_id from managed_users where email = 'editor@platform.io' limit 1
)
insert into ai_prompt_versions (
  config_id, version_number, prompt_text, status, change_reason,
  created_by, updated_by, reviewed_by, reviewed_at, published_by, published_at, safety_checklist
)
select
  cfg.config_id,
  v.version_number,
  v.prompt_text,
  v.status,
  v.change_reason,
  editor_user.user_id,
  editor_user.user_id,
  case when v.status in ('approved', 'published') then admin_user.user_id else null end,
  case when v.status in ('approved', 'published') then now() - interval '30 minute' else null end,
  case when v.status = 'published' then admin_user.user_id else null end,
  case when v.status = 'published' then now() - interval '20 minute' else null end,
  '{"identityVerification": true, "noSensitiveLeak": true}'::jsonb
from cfg, admin_user, editor_user,
(
  values
    (1, 'You are a banking assistant. Always verify customer identity before account actions. Never reveal internal credentials.', 'published', 'Initial approved baseline prompt'),
    (2, 'You are a banking assistant. Verify identity with at least two factors before balance or transfer actions. Never expose secrets.', 'approved', 'Improve verification strictness'),
    (3, 'You are a banking assistant. Verify customer identity before any account operations and route high-risk intents to human agents.', 'in_review', 'Add fraud escalation rule'),
    (4, 'You are a banking assistant. Verify identity and ask for consent before sensitive operations. Escalate suspicious requests.', 'draft', 'Draft with consent requirement')
) as v(version_number, prompt_text, status, change_reason)
on conflict (config_id, version_number) do nothing;

-- 4) Set currently published version in config
update ai_prompt_configs c
set current_published_version_id = pv.id,
    updated_at = now()
from ai_prompt_versions pv
where c.slug = 'global-banking-assistant'
  and pv.config_id = c.id
  and pv.status = 'published';

-- 5) Seed review records
insert into ai_prompt_reviews (version_id, reviewer_id, decision, notes)
select
  pv.id,
  mu.id,
  'approved',
  'Reviewed and accepted for banking safety compliance.'
from ai_prompt_versions pv
join ai_prompt_configs pc on pc.id = pv.config_id
join managed_users mu on mu.email = 'admin@platform.io'
where pc.slug = 'global-banking-assistant'
  and pv.status in ('approved', 'published')
  and not exists (
    select 1 from ai_prompt_reviews r where r.version_id = pv.id
  );

-- 6) Seed audit events
insert into ai_prompt_audit_log (
  config_id, version_id, actor_user_id, actor_role, action, reason, metadata
)
select
  pv.config_id,
  pv.id,
  mu.id,
  mu.role,
  case
    when pv.status = 'published' then 'prompt_published'
    when pv.status = 'approved' then 'review_approved'
    when pv.status = 'in_review' then 'draft_submitted_for_review'
    else 'draft_created'
  end,
  pv.change_reason,
  jsonb_build_object('seed', true, 'version_number', pv.version_number, 'status', pv.status)
from ai_prompt_versions pv
join ai_prompt_configs pc on pc.id = pv.config_id
join managed_users mu on mu.email = case
  when pv.status in ('published', 'approved') then 'admin@platform.io'
  else 'editor@platform.io'
end
where pc.slug = 'global-banking-assistant'
  and not exists (
    select 1
    from ai_prompt_audit_log a
    where a.version_id = pv.id
      and a.metadata ->> 'seed' = 'true'
  );

-- 7) Optional quick check query
-- select
--   pc.slug,
--   pv.version_number,
--   pv.status,
--   pv.change_reason,
--   pv.updated_at
-- from ai_prompt_versions pv
-- join ai_prompt_configs pc on pc.id = pv.config_id
-- where pc.slug = 'global-banking-assistant'
-- order by pv.version_number desc;
