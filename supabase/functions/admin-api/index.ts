import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, status);
}

function parseRoute(url: string): {
  resource: string;
  id: string | null;
  action: string | null;
  segments: string[];
} {
  const path = new URL(url).pathname.replace(/^\/admin-api\/?/, "");
  const segments = path.split("/").filter(Boolean);
  return {
    resource: segments[0] || "",
    id: segments[1] || null,
    action: segments[2] || null,
    segments,
  };
}

function getSearchParams(url: string) {
  return new URL(url).searchParams;
}

type SupabaseClient = ReturnType<typeof createClient>;
type PromptStatus = "draft" | "in_review" | "approved" | "published" | "rejected" | "archived";

function ensureObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

async function getManagedUser(supabase: SupabaseClient, email: string | undefined) {
  if (!email) return null;
  const { data } = await supabase
    .from("managed_users")
    .select("id, role, email")
    .ilike("email", email)
    .maybeSingle();
  return data as { id: string; role: string; email: string } | null;
}

function enforceRole(role: string | null, allowed: string[]) {
  return !!role && allowed.includes(role);
}

function validatePrompt(promptText: string) {
  const minLength = 120;
  const maxLength = 12000;
  if (promptText.length < minLength) {
    return `Prompt is too short. Minimum ${minLength} characters are required.`;
  }
  if (promptText.length > maxLength) {
    return `Prompt is too long. Maximum ${maxLength} characters are allowed.`;
  }

  const normalized = promptText.toLowerCase();
  const hasSafetyClause = [
    "verify customer identity",
    "identity verification",
    "authenticate customer",
    "verification before account",
  ].some((marker) => normalized.includes(marker));
  if (!hasSafetyClause) {
    return "Prompt must include a customer identity verification safety clause.";
  }

  const blockedPatterns = [
    /reveal\s+(?:api|access|secret|private)\s+key/i,
    /ignore\s+all\s+security/i,
    /bypass\s+authentication/i,
    /share\s+internal\s+credentials/i,
  ];
  if (blockedPatterns.some((pattern) => pattern.test(promptText))) {
    return "Prompt contains blocked instructions that violate banking safety policies.";
  }

  return null;
}

async function getGlobalPromptConfig(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("ai_prompt_configs")
    .select("*")
    .eq("slug", "global-banking-assistant")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (data) return data;

  const { data: created, error: createError } = await supabase
    .from("ai_prompt_configs")
    .insert([{
      slug: "global-banking-assistant",
      name: "Global Banking Assistant Prompt",
      description: "Single global prompt for the banking conversational assistant.",
    }])
    .select("*")
    .maybeSingle();
  if (createError || !created) {
    throw new Error(createError?.message || "Failed to initialize prompt config");
  }
  return created;
}

async function logPromptAudit(
  supabase: SupabaseClient,
  args: {
    configId?: string | null;
    versionId?: string | null;
    actorUserId?: string | null;
    actorRole?: string | null;
    action: string;
    reason?: string | null;
    beforeState?: unknown;
    afterState?: unknown;
    metadata?: Record<string, unknown>;
  }
) {
  await supabase.from("ai_prompt_audit_log").insert([{
    config_id: args.configId ?? null,
    version_id: args.versionId ?? null,
    actor_user_id: args.actorUserId ?? null,
    actor_role: args.actorRole ?? null,
    action: args.action,
    reason: args.reason ?? null,
    before_state: args.beforeState ?? null,
    after_state: args.afterState ?? null,
    metadata: args.metadata ?? {},
  }]);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return errorResponse("Missing authorization header", 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const { resource, id, action, segments } = parseRoute(req.url);
    const method = req.method;
    const managedUser = await getManagedUser(supabase, user.email);
    const managedRole = managedUser?.role ?? null;

    switch (resource) {
      case "users":
        return await handleUsers(supabase, method, id, req);
      case "products":
        return await handleProducts(supabase, method, id, req);
      case "features":
        return await handleFeatures(supabase, method, id, action, req);
      case "dashboard":
        return await handleDashboard(supabase, req);
      case "system":
        return await handleSystem(supabase, method, action, id, req);
      case "activity":
        return await handleActivity(supabase, req);
      case "ai-prompts":
        return await handleAIPrompts(supabase, method, segments, req, managedUser, managedRole);
      default:
        return jsonResponse({
          message: "Admin API",
          endpoints: [
            "GET    /admin-api/users?search=&role=&status=&page=&limit=",
            "POST   /admin-api/users",
            "PUT    /admin-api/users/:id",
            "DELETE /admin-api/users/:id",
            "GET    /admin-api/products?search=&category=&status=&priceMin=&priceMax=&page=&limit=",
            "POST   /admin-api/products",
            "PUT    /admin-api/products/:id",
            "DELETE /admin-api/products/:id",
            "GET    /admin-api/features",
            "PUT    /admin-api/features/:id/toggle",
            "PUT    /admin-api/features/:id/config",
            "GET    /admin-api/dashboard?range=30d",
            "GET    /admin-api/system/metrics",
            "GET    /admin-api/system/alerts",
            "PUT    /admin-api/system/alerts/:id/resolve",
            "GET    /admin-api/system/errors",
            "GET    /admin-api/activity?range=30d&limit=50",
            "GET    /admin-api/ai-prompts/current",
            "GET    /admin-api/ai-prompts/versions",
            "GET    /admin-api/ai-prompts/audit?limit=50",
            "GET    /admin-api/ai-prompts/compare/:leftVersionId/:rightVersionId",
            "POST   /admin-api/ai-prompts/drafts",
            "PUT    /admin-api/ai-prompts/drafts/:id",
            "POST   /admin-api/ai-prompts/reviews/:draftId/submit",
            "POST   /admin-api/ai-prompts/reviews/:draftId/approve",
            "POST   /admin-api/ai-prompts/reviews/:draftId/reject",
            "POST   /admin-api/ai-prompts/publish/:approvedId",
            "POST   /admin-api/ai-prompts/rollback/:versionId",
          ],
        });
    }
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Internal server error",
      500
    );
  }
});

async function handleAIPrompts(
  supabase: SupabaseClient,
  method: string,
  segments: string[],
  req: Request,
  managedUser: { id: string; role: string; email: string } | null,
  managedRole: string | null
) {
  const section = segments[1] ?? null;
  const id = segments[2] ?? null;
  const action = segments[3] ?? null;
  const params = getSearchParams(req.url);
  const config = await getGlobalPromptConfig(supabase);

  if (method === "GET" && section === "current") {
    if (!config.current_published_version_id) return jsonResponse({ config, data: null });
    const { data, error } = await supabase
      .from("ai_prompt_versions")
      .select("*")
      .eq("id", config.current_published_version_id)
      .maybeSingle();
    if (error) return errorResponse(error.message);
    return jsonResponse({ config, data });
  }

  if (method === "GET" && section === "versions") {
    const { data, error } = await supabase
      .from("ai_prompt_versions")
      .select("*")
      .eq("config_id", config.id)
      .order("version_number", { ascending: false });
    if (error) return errorResponse(error.message);
    return jsonResponse({ data: data ?? [] });
  }

  if (method === "GET" && section === "audit") {
    const limit = Number(params.get("limit") || "50");
    const { data, error } = await supabase
      .from("ai_prompt_audit_log")
      .select("*")
      .eq("config_id", config.id)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return errorResponse(error.message);
    return jsonResponse({ data: data ?? [] });
  }

  if (method === "GET" && section === "compare" && id && action) {
    const { data: versions, error } = await supabase
      .from("ai_prompt_versions")
      .select("id, version_number, prompt_text, status, change_reason, updated_at")
      .in("id", [id, action]);
    if (error) return errorResponse(error.message);
    if (!versions || versions.length !== 2) return errorResponse("Both versions are required", 404);
    const left = versions.find((v: { id: string }) => v.id === id);
    const right = versions.find((v: { id: string }) => v.id === action);
    if (!left || !right) return errorResponse("Version compare target not found", 404);
    return jsonResponse({
      left,
      right,
      summary: {
        leftLength: left.prompt_text.length,
        rightLength: right.prompt_text.length,
        delta: right.prompt_text.length - left.prompt_text.length,
        sameText: left.prompt_text === right.prompt_text,
      },
    });
  }

  if (method === "POST" && section === "drafts") {
    if (!enforceRole(managedRole, ["admin", "editor"])) return errorResponse("Only editor/admin can create drafts", 403);
    const body = ensureObject(await req.json());
    const promptText = String(body.promptText ?? "").trim();
    const changeReason = String(body.changeReason ?? "").trim();
    if (!changeReason) return errorResponse("changeReason is required");
    const validationError = validatePrompt(promptText);
    if (validationError) return errorResponse(validationError);

    const { data: latestVersion } = await supabase
      .from("ai_prompt_versions")
      .select("version_number")
      .eq("config_id", config.id)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextVersion = ((latestVersion as { version_number?: number } | null)?.version_number ?? 0) + 1;

    const { data, error } = await supabase
      .from("ai_prompt_versions")
      .insert([{
        config_id: config.id,
        version_number: nextVersion,
        prompt_text: promptText,
        status: "draft" satisfies PromptStatus,
        change_reason: changeReason,
        created_by: managedUser?.id ?? null,
        updated_by: managedUser?.id ?? null,
      }])
      .select("*")
      .maybeSingle();
    if (error) return errorResponse(error.message);

    await logPromptAudit(supabase, {
      configId: config.id,
      versionId: (data as { id: string }).id,
      actorUserId: managedUser?.id,
      actorRole: managedRole,
      action: "draft_created",
      reason: changeReason,
      afterState: data,
    });
    return jsonResponse({ data }, 201);
  }

  if (method === "PUT" && section === "drafts" && id) {
    if (!enforceRole(managedRole, ["admin", "editor"])) return errorResponse("Only editor/admin can edit drafts", 403);
    const body = ensureObject(await req.json());
    const promptText = String(body.promptText ?? "").trim();
    const changeReason = String(body.changeReason ?? "").trim();
    if (!changeReason) return errorResponse("changeReason is required");
    const validationError = validatePrompt(promptText);
    if (validationError) return errorResponse(validationError);

    const { data: beforeDraft } = await supabase
      .from("ai_prompt_versions")
      .select("*")
      .eq("id", id)
      .eq("config_id", config.id)
      .maybeSingle();
    if (!beforeDraft) return errorResponse("Draft not found", 404);
    if ((beforeDraft as { status: PromptStatus }).status !== "draft") return errorResponse("Only draft versions can be edited");

    const { data, error } = await supabase
      .from("ai_prompt_versions")
      .update({
        prompt_text: promptText,
        change_reason: changeReason,
        updated_by: managedUser?.id ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) return errorResponse(error.message);

    await logPromptAudit(supabase, {
      configId: config.id,
      versionId: id,
      actorUserId: managedUser?.id,
      actorRole: managedRole,
      action: "draft_updated",
      reason: changeReason,
      beforeState: beforeDraft,
      afterState: data,
    });
    return jsonResponse({ data });
  }

  if (method === "POST" && section === "reviews" && id && action === "submit") {
    if (!enforceRole(managedRole, ["admin", "editor"])) return errorResponse("Only editor/admin can submit drafts", 403);
    const body = ensureObject(await req.json());
    const changeReason = String(body.changeReason ?? "").trim();
    if (!changeReason) return errorResponse("changeReason is required");

    const { data: draft } = await supabase
      .from("ai_prompt_versions")
      .select("*")
      .eq("id", id)
      .eq("config_id", config.id)
      .maybeSingle();
    if (!draft) return errorResponse("Draft not found", 404);
    if ((draft as { status: PromptStatus }).status !== "draft") return errorResponse("Only draft versions can be submitted");

    const { data, error } = await supabase
      .from("ai_prompt_versions")
      .update({
        status: "in_review" satisfies PromptStatus,
        updated_by: managedUser?.id ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) return errorResponse(error.message);

    await logPromptAudit(supabase, {
      configId: config.id,
      versionId: id,
      actorUserId: managedUser?.id,
      actorRole: managedRole,
      action: "draft_submitted_for_review",
      reason: changeReason,
      beforeState: draft,
      afterState: data,
    });
    return jsonResponse({ data });
  }

  if (method === "POST" && section === "reviews" && id && (action === "approve" || action === "reject")) {
    if (!enforceRole(managedRole, ["admin"])) return errorResponse("Only admin can approve/reject reviews", 403);
    const body = ensureObject(await req.json());
    const reviewNotes = String(body.reviewNotes ?? "").trim();
    const changeReason = String(body.changeReason ?? "").trim();
    if (!changeReason) return errorResponse("changeReason is required");

    const { data: reviewedVersion } = await supabase
      .from("ai_prompt_versions")
      .select("*")
      .eq("id", id)
      .eq("config_id", config.id)
      .maybeSingle();
    if (!reviewedVersion) return errorResponse("Version not found", 404);
    if ((reviewedVersion as { status: PromptStatus }).status !== "in_review") {
      return errorResponse("Only in-review versions can be approved or rejected");
    }

    const nextStatus: PromptStatus = action === "approve" ? "approved" : "rejected";
    const { data: updatedVersion, error: updateError } = await supabase
      .from("ai_prompt_versions")
      .update({
        status: nextStatus,
        reviewed_by: managedUser?.id ?? null,
        reviewed_at: new Date().toISOString(),
        updated_by: managedUser?.id ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (updateError) return errorResponse(updateError.message);

    const { error: reviewInsertError } = await supabase
      .from("ai_prompt_reviews")
      .insert([{
        version_id: id,
        reviewer_id: managedUser?.id ?? null,
        decision: action === "approve" ? "approved" : "rejected",
        notes: reviewNotes,
      }]);
    if (reviewInsertError) return errorResponse(reviewInsertError.message);

    await logPromptAudit(supabase, {
      configId: config.id,
      versionId: id,
      actorUserId: managedUser?.id,
      actorRole: managedRole,
      action: action === "approve" ? "review_approved" : "review_rejected",
      reason: changeReason,
      beforeState: reviewedVersion,
      afterState: updatedVersion,
      metadata: { reviewNotes },
    });
    return jsonResponse({ data: updatedVersion });
  }

  if (method === "POST" && section === "publish" && id) {
    if (!enforceRole(managedRole, ["admin"])) return errorResponse("Only admin can publish versions", 403);
    const body = ensureObject(await req.json());
    const changeReason = String(body.changeReason ?? "").trim();
    if (!changeReason) return errorResponse("changeReason is required");

    const { data: targetVersion } = await supabase
      .from("ai_prompt_versions")
      .select("*")
      .eq("id", id)
      .eq("config_id", config.id)
      .maybeSingle();
    if (!targetVersion) return errorResponse("Approved version not found", 404);
    if ((targetVersion as { status: PromptStatus }).status !== "approved") return errorResponse("Only approved versions can be published");

    const { data: previousPublished } = await supabase
      .from("ai_prompt_versions")
      .select("*")
      .eq("config_id", config.id)
      .eq("status", "published")
      .maybeSingle();
    if (previousPublished?.id) {
      await supabase
        .from("ai_prompt_versions")
        .update({ status: "archived" satisfies PromptStatus, updated_at: new Date().toISOString() })
        .eq("id", previousPublished.id);
    }

    const { data: published, error: publishError } = await supabase
      .from("ai_prompt_versions")
      .update({
        status: "published" satisfies PromptStatus,
        published_by: managedUser?.id ?? null,
        published_at: new Date().toISOString(),
        updated_by: managedUser?.id ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (publishError) return errorResponse(publishError.message);

    const { error: configError } = await supabase
      .from("ai_prompt_configs")
      .update({ current_published_version_id: id, updated_at: new Date().toISOString() })
      .eq("id", config.id);
    if (configError) return errorResponse(configError.message);

    await logPromptAudit(supabase, {
      configId: config.id,
      versionId: id,
      actorUserId: managedUser?.id,
      actorRole: managedRole,
      action: "prompt_published",
      reason: changeReason,
      beforeState: previousPublished,
      afterState: published,
    });
    return jsonResponse({ data: published });
  }

  if (method === "POST" && section === "rollback" && id) {
    if (!enforceRole(managedRole, ["admin"])) return errorResponse("Only admin can rollback versions", 403);
    const body = ensureObject(await req.json());
    const changeReason = String(body.changeReason ?? "").trim();
    if (!changeReason) return errorResponse("changeReason is required");

    const { data: rollbackTarget } = await supabase
      .from("ai_prompt_versions")
      .select("*")
      .eq("id", id)
      .eq("config_id", config.id)
      .maybeSingle();
    if (!rollbackTarget) return errorResponse("Rollback target not found", 404);

    const { data: previousPublished } = await supabase
      .from("ai_prompt_versions")
      .select("*")
      .eq("config_id", config.id)
      .eq("status", "published")
      .maybeSingle();
    if (previousPublished?.id) {
      await supabase
        .from("ai_prompt_versions")
        .update({ status: "archived" satisfies PromptStatus, updated_at: new Date().toISOString() })
        .eq("id", previousPublished.id);
    }

    const { data: published, error: publishError } = await supabase
      .from("ai_prompt_versions")
      .update({
        status: "published" satisfies PromptStatus,
        published_by: managedUser?.id ?? null,
        published_at: new Date().toISOString(),
        updated_by: managedUser?.id ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (publishError) return errorResponse(publishError.message);

    const { error: configError } = await supabase
      .from("ai_prompt_configs")
      .update({ current_published_version_id: id, updated_at: new Date().toISOString() })
      .eq("id", config.id);
    if (configError) return errorResponse(configError.message);

    await logPromptAudit(supabase, {
      configId: config.id,
      versionId: id,
      actorUserId: managedUser?.id,
      actorRole: managedRole,
      action: "prompt_rollback",
      reason: changeReason,
      beforeState: previousPublished,
      afterState: published,
    });
    return jsonResponse({ data: published });
  }

  return errorResponse("Unknown ai-prompts endpoint", 404);
}

// ──────────────────────────────────────────────
// Users
// ──────────────────────────────────────────────

async function handleUsers(
  supabase: ReturnType<typeof createClient>,
  method: string,
  id: string | null,
  req: Request
) {
  if (method === "GET") {
    const params = getSearchParams(req.url);
    const page = Number(params.get("page") || "1");
    const limit = Number(params.get("limit") || "10");
    const search = params.get("search") || "";
    const role = params.get("role") || "all";
    const status = params.get("status") || "all";

    let query = supabase
      .from("managed_users")
      .select("*", { count: "exact" });

    if (search) {
      query = query.or(
        `username.ilike.%${search}%,email.ilike.%${search}%`
      );
    }
    if (role !== "all") query = query.eq("role", role);
    if (status !== "all") query = query.eq("status", status);

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) return errorResponse(error.message);
    return jsonResponse({ data, total: count, page, limit });
  }

  if (method === "POST") {
    const body = await req.json();
    const { username, email, role, status } = body;
    if (!username || !email || !role || !status) {
      return errorResponse("username, email, role, and status are required");
    }
    const { data, error } = await supabase
      .from("managed_users")
      .insert([{ username, email, role, status }])
      .select()
      .maybeSingle();
    if (error) return errorResponse(error.message);
    return jsonResponse({ data }, 201);
  }

  if (method === "PUT" && id) {
    const body = await req.json();
    const { username, email, role, status } = body;
    const { data, error } = await supabase
      .from("managed_users")
      .update({ username, email, role, status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) return errorResponse(error.message);
    if (!data) return errorResponse("User not found", 404);
    return jsonResponse({ data });
  }

  if (method === "DELETE" && id) {
    const { error } = await supabase
      .from("managed_users")
      .delete()
      .eq("id", id);
    if (error) return errorResponse(error.message);
    return jsonResponse({ message: "User deleted" });
  }

  return errorResponse("Method not allowed", 405);
}

// ──────────────────────────────────────────────
// Products
// ──────────────────────────────────────────────

async function handleProducts(
  supabase: ReturnType<typeof createClient>,
  method: string,
  id: string | null,
  req: Request
) {
  if (method === "GET" && !id) {
    const params = getSearchParams(req.url);
    const page = Number(params.get("page") || "1");
    const limit = Number(params.get("limit") || "10");
    const search = params.get("search") || "";
    const category = params.get("category") || "all";
    const status = params.get("status") || "all";
    const priceMin = params.get("priceMin");
    const priceMax = params.get("priceMax");

    let query = supabase
      .from("products")
      .select("*", { count: "exact" });

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,sku.ilike.%${search}%,description.ilike.%${search}%`
      );
    }
    if (category !== "all") query = query.eq("category", category);
    if (status !== "all") query = query.eq("status", status);
    if (priceMin) query = query.gte("price", Number(priceMin));
    if (priceMax) query = query.lte("price", Number(priceMax));

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) return errorResponse(error.message);

    const { data: catData } = await supabase.from("products").select("category");
    const categories = [...new Set((catData ?? []).map((d: { category: string }) => d.category))].sort();

    return jsonResponse({ data, total: count, page, limit, categories });
  }

  if (method === "GET" && id) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) return errorResponse(error.message);
    if (!data) return errorResponse("Product not found", 404);
    return jsonResponse({ data });
  }

  if (method === "POST") {
    const body = await req.json();
    const { name, description, category, price, currency, status, sku, stock } = body;
    if (!name || !category) {
      return errorResponse("name and category are required");
    }
    const { data, error } = await supabase
      .from("products")
      .insert([{ name, description, category, price, currency, status, sku, stock }])
      .select()
      .maybeSingle();
    if (error) return errorResponse(error.message);
    return jsonResponse({ data }, 201);
  }

  if (method === "PUT" && id) {
    const body = await req.json();
    const { name, description, category, price, currency, status, sku, stock } = body;
    const { data, error } = await supabase
      .from("products")
      .update({
        name, description, category, price, currency, status, sku, stock,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) return errorResponse(error.message);
    if (!data) return errorResponse("Product not found", 404);
    return jsonResponse({ data });
  }

  if (method === "DELETE" && id) {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);
    if (error) return errorResponse(error.message);
    return jsonResponse({ message: "Product deleted" });
  }

  return errorResponse("Method not allowed", 405);
}

// ──────────────────────────────────────────────
// Feature Flags
// ──────────────────────────────────────────────

async function handleFeatures(
  supabase: ReturnType<typeof createClient>,
  method: string,
  id: string | null,
  action: string | null,
  req: Request
) {
  if (method === "GET") {
    const { data, error } = await supabase
      .from("feature_flags")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) return errorResponse(error.message);
    return jsonResponse({ data });
  }

  if (method === "PUT" && id && action === "toggle") {
    const { data: existing } = await supabase
      .from("feature_flags")
      .select("enabled")
      .eq("id", id)
      .maybeSingle();
    if (!existing) return errorResponse("Feature not found", 404);

    const { data, error } = await supabase
      .from("feature_flags")
      .update({ enabled: !existing.enabled, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) return errorResponse(error.message);
    return jsonResponse({ data });
  }

  if (method === "PUT" && id && action === "config") {
    const { config } = await req.json();
    if (!config || typeof config !== "object") {
      return errorResponse("config object is required");
    }
    const { data, error } = await supabase
      .from("feature_flags")
      .update({ config, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) return errorResponse(error.message);
    if (!data) return errorResponse("Feature not found", 404);
    return jsonResponse({ data });
  }

  return errorResponse("Method not allowed", 405);
}

// ──────────────────────────────────────────────
// Dashboard
// ──────────────────────────────────────────────

async function handleDashboard(
  supabase: ReturnType<typeof createClient>,
  req: Request
) {
  const params = getSearchParams(req.url);
  const range = params.get("range") || "30d";

  let rangeDate: string | null = null;
  if (range !== "all") {
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    const d = new Date();
    d.setDate(d.getDate() - days);
    rangeDate = d.toISOString();
  }

  let activityQuery = supabase
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (rangeDate) activityQuery = activityQuery.gte("created_at", rangeDate);

  const [usersRes, activitiesRes] = await Promise.all([
    supabase.from("managed_users").select("*"),
    activityQuery,
  ]);

  const allUsers = usersRes.data ?? [];
  const allActivities = activitiesRes.data ?? [];

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const metrics = {
    totalUsers: allUsers.length,
    activeUsers: allUsers.filter((u: { status: string }) => u.status === "active").length,
    inactiveUsers: allUsers.filter((u: { status: string }) => u.status === "inactive").length,
    suspendedUsers: allUsers.filter((u: { status: string }) => u.status === "suspended").length,
    adminCount: allUsers.filter((u: { role: string }) => u.role === "admin").length,
    editorCount: allUsers.filter((u: { role: string }) => u.role === "editor").length,
    viewerCount: allUsers.filter((u: { role: string }) => u.role === "viewer").length,
    recentLogins: allActivities.filter((a: { action: string }) => a.action === "login").length,
    newUsersThisWeek: allUsers.filter((u: { created_at: string }) => new Date(u.created_at) >= weekAgo).length,
    newUsersThisMonth: allUsers.filter((u: { created_at: string }) => new Date(u.created_at) >= monthAgo).length,
  };

  const days = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 90;
  const usersByDay: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const count = allUsers.filter(
      (u: { created_at: string }) => u.created_at.split("T")[0] === dateStr
    ).length;
    usersByDay.push({ date: dateStr, count });
  }

  const activityCounts: Record<string, number> = {};
  for (const a of allActivities) {
    activityCounts[(a as { action: string }).action] =
      (activityCounts[(a as { action: string }).action] || 0) + 1;
  }
  const activityByType = Object.entries(activityCounts).map(
    ([action, count]) => ({ action, count })
  );

  return jsonResponse({
    metrics,
    activities: allActivities,
    users: allUsers,
    usersByDay,
    activityByType,
  });
}

// ──────────────────────────────────────────────
// System Monitoring
// ──────────────────────────────────────────────

async function handleSystem(
  supabase: ReturnType<typeof createClient>,
  method: string,
  action: string | null,
  id: string | null,
  _req: Request
) {
  if (method === "GET" && action === "metrics") {
    const { data, error } = await supabase
      .from("system_metrics")
      .select("*")
      .order("recorded_at", { ascending: true });
    if (error) return errorResponse(error.message);

    const getLatest = (type: string): number => {
      const items = (data ?? []).filter(
        (m: { metric_type: string }) => m.metric_type === type
      );
      return items.length > 0 ? Math.round(Number(items[items.length - 1].value)) : 0;
    };

    const current = {
      cpu: getLatest("cpu"),
      memory: getLatest("memory"),
      disk: getLatest("disk"),
      network: getLatest("network"),
      latency: getLatest("latency"),
      requestTime: getLatest("request_time"),
    };

    return jsonResponse({ data, current });
  }

  if (method === "GET" && action === "alerts") {
    const { data, error } = await supabase
      .from("system_alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return errorResponse(error.message);

    const unresolved = (data ?? []).filter((a: { resolved: boolean }) => !a.resolved);
    const criticalCount = unresolved.filter(
      (a: { severity: string }) => a.severity === "critical"
    ).length;
    const warningCount = unresolved.filter(
      (a: { severity: string }) => a.severity === "warning"
    ).length;

    return jsonResponse({ data, unresolved, criticalCount, warningCount });
  }

  if (method === "PUT" && action === "alerts" && id) {
    const { data, error } = await supabase
      .from("system_alerts")
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) return errorResponse(error.message);
    if (!data) return errorResponse("Alert not found", 404);
    return jsonResponse({ data });
  }

  if (method === "GET" && action === "errors") {
    const { data, error } = await supabase
      .from("error_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return errorResponse(error.message);
    return jsonResponse({ data });
  }

  return errorResponse("Unknown system endpoint", 404);
}

// ──────────────────────────────────────────────
// Activity Log
// ──────────────────────────────────────────────

async function handleActivity(
  supabase: ReturnType<typeof createClient>,
  req: Request
) {
  const params = getSearchParams(req.url);
  const range = params.get("range") || "30d";
  const limit = Number(params.get("limit") || "50");

  let query = supabase
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (range !== "all") {
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    const d = new Date();
    d.setDate(d.getDate() - days);
    query = query.gte("created_at", d.toISOString());
  }

  const { data, error } = await query;
  if (error) return errorResponse(error.message);
  return jsonResponse({ data });
}
