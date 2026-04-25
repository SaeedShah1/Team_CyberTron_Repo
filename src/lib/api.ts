import { supabase } from './supabase';

const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api`;

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Authentication required. Please sign in to continue.');
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `Request failed with status ${res.status}`);
  return json as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),
  aiPrompts: {
    getCurrent: <T>() => request<T>('/ai-prompts/current'),
    getVersions: <T>() => request<T>('/ai-prompts/versions'),
    getAudit: <T>(limit = 50) => request<T>(`/ai-prompts/audit?limit=${limit}`),
    compareVersions: <T>(leftVersionId: string, rightVersionId: string) =>
      request<T>(`/ai-prompts/compare/${leftVersionId}/${rightVersionId}`),
    createDraft: <T>(body: { promptText: string; changeReason: string }) =>
      request<T>('/ai-prompts/drafts', { method: 'POST', body: JSON.stringify(body) }),
    updateDraft: <T>(id: string, body: { promptText: string; changeReason: string }) =>
      request<T>(`/ai-prompts/drafts/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    submitReview: <T>(draftId: string, body: { changeReason: string }) =>
      request<T>(`/ai-prompts/reviews/${draftId}/submit`, { method: 'POST', body: JSON.stringify(body) }),
    approveReview: <T>(draftId: string, body: { changeReason: string; reviewNotes?: string }) =>
      request<T>(`/ai-prompts/reviews/${draftId}/approve`, { method: 'POST', body: JSON.stringify(body) }),
    rejectReview: <T>(draftId: string, body: { changeReason: string; reviewNotes?: string }) =>
      request<T>(`/ai-prompts/reviews/${draftId}/reject`, { method: 'POST', body: JSON.stringify(body) }),
    publishVersion: <T>(approvedId: string, body: { changeReason: string }) =>
      request<T>(`/ai-prompts/publish/${approvedId}`, { method: 'POST', body: JSON.stringify(body) }),
    rollbackVersion: <T>(versionId: string, body: { changeReason: string }) =>
      request<T>(`/ai-prompts/rollback/${versionId}`, { method: 'POST', body: JSON.stringify(body) }),
  },
};
