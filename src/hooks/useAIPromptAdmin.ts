import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import type { AIPromptAuditEntry, AIPromptConfig, AIPromptVersion } from '../lib/types';

interface PromptCurrentResponse {
  config: AIPromptConfig;
  data: AIPromptVersion | null;
}

interface PromptVersionsResponse {
  data: AIPromptVersion[];
}

interface PromptAuditResponse {
  data: AIPromptAuditEntry[];
}

interface PromptMutateResponse {
  data: AIPromptVersion;
}

export function useAIPromptAdmin() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<AIPromptConfig | null>(null);
  const [currentVersion, setCurrentVersion] = useState<AIPromptVersion | null>(null);
  const [versions, setVersions] = useState<AIPromptVersion[]>([]);
  const [auditLog, setAuditLog] = useState<AIPromptAuditEntry[]>([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [currentRes, versionsRes, auditRes] = await Promise.all([
        api.aiPrompts.getCurrent<PromptCurrentResponse>(),
        api.aiPrompts.getVersions<PromptVersionsResponse>(),
        api.aiPrompts.getAudit<PromptAuditResponse>(100),
      ]);
      setConfig(currentRes.config);
      setCurrentVersion(currentRes.data);
      setVersions(versionsRes.data ?? []);
      setAuditLog(auditRes.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load AI prompt data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const runMutation = useCallback(async (op: () => Promise<PromptMutateResponse>) => {
    setSaving(true);
    setError(null);
    try {
      await op();
      await refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
      return false;
    } finally {
      setSaving(false);
    }
  }, [refresh]);

  const createDraft = useCallback(
    (promptText: string, changeReason: string) =>
      runMutation(() => api.aiPrompts.createDraft<PromptMutateResponse>({ promptText, changeReason })),
    [runMutation]
  );

  const updateDraft = useCallback(
    (id: string, promptText: string, changeReason: string) =>
      runMutation(() => api.aiPrompts.updateDraft<PromptMutateResponse>(id, { promptText, changeReason })),
    [runMutation]
  );

  const submitReview = useCallback(
    (draftId: string, changeReason: string) =>
      runMutation(() => api.aiPrompts.submitReview<PromptMutateResponse>(draftId, { changeReason })),
    [runMutation]
  );

  const approveReview = useCallback(
    (draftId: string, changeReason: string, reviewNotes?: string) =>
      runMutation(() => api.aiPrompts.approveReview<PromptMutateResponse>(draftId, { changeReason, reviewNotes })),
    [runMutation]
  );

  const rejectReview = useCallback(
    (draftId: string, changeReason: string, reviewNotes?: string) =>
      runMutation(() => api.aiPrompts.rejectReview<PromptMutateResponse>(draftId, { changeReason, reviewNotes })),
    [runMutation]
  );

  const publishVersion = useCallback(
    (approvedId: string, changeReason: string) =>
      runMutation(() => api.aiPrompts.publishVersion<PromptMutateResponse>(approvedId, { changeReason })),
    [runMutation]
  );

  const rollbackVersion = useCallback(
    (versionId: string, changeReason: string) =>
      runMutation(() => api.aiPrompts.rollbackVersion<PromptMutateResponse>(versionId, { changeReason })),
    [runMutation]
  );

  const latestDraft = useMemo(
    () => versions.find((v) => v.status === 'draft') ?? null,
    [versions]
  );
  const reviewQueue = useMemo(
    () => versions.filter((v) => v.status === 'in_review'),
    [versions]
  );
  const approvedQueue = useMemo(
    () => versions.filter((v) => v.status === 'approved'),
    [versions]
  );

  return {
    loading,
    saving,
    error,
    config,
    currentVersion,
    versions,
    auditLog,
    latestDraft,
    reviewQueue,
    approvedQueue,
    refresh,
    createDraft,
    updateDraft,
    submitReview,
    approveReview,
    rejectReview,
    publishVersion,
    rollbackVersion,
  };
}
