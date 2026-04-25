import { useMemo, useState } from 'react';
import { Bot, History, RefreshCw, ShieldCheck, Upload, Undo2 } from 'lucide-react';
import { useAIPromptAdmin } from '../hooks/useAIPromptAdmin';

const defaultPrompt = `You are a banking conversational assistant. Always verify customer identity before account-specific actions and never expose internal credentials or security controls.`;

export function AIAdminAgent() {
  const {
    loading,
    saving,
    error,
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
  } = useAIPromptAdmin();

  const [promptText, setPromptText] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');

  const activeEditorVersionId = latestDraft?.id ?? null;
  const editorLabel = activeEditorVersionId ? `Editing Draft v${latestDraft?.version_number}` : 'Create New Draft';

  const populatedPrompt = useMemo(() => {
    if (promptText.trim()) return promptText;
    if (latestDraft?.prompt_text) return latestDraft.prompt_text;
    if (currentVersion?.prompt_text) return currentVersion.prompt_text;
    return defaultPrompt;
  }, [promptText, latestDraft?.prompt_text, currentVersion?.prompt_text]);

  const onSaveDraft = async () => {
    if (!changeReason.trim()) return;
    if (activeEditorVersionId) {
      const ok = await updateDraft(activeEditorVersionId, populatedPrompt, changeReason);
      if (ok) setChangeReason('');
      return;
    }
    const ok = await createDraft(populatedPrompt, changeReason);
    if (ok) {
      setPromptText('');
      setChangeReason('');
    }
  };

  const onSubmitReview = async () => {
    if (!latestDraft || !changeReason.trim()) return;
    const ok = await submitReview(latestDraft.id, changeReason);
    if (ok) setChangeReason('');
  };

  const onApprove = async (versionId: string) => {
    if (!changeReason.trim()) return;
    const ok = await approveReview(versionId, changeReason, reviewNotes);
    if (ok) {
      setChangeReason('');
      setReviewNotes('');
    }
  };

  const onReject = async (versionId: string) => {
    if (!changeReason.trim()) return;
    const ok = await rejectReview(versionId, changeReason, reviewNotes);
    if (ok) {
      setChangeReason('');
      setReviewNotes('');
    }
  };

  const onPublish = async () => {
    const candidate = approvedQueue[0];
    if (!candidate || !changeReason.trim()) return;
    const ok = await publishVersion(candidate.id, changeReason);
    if (ok) setChangeReason('');
  };

  const onRollback = async (versionId: string) => {
    if (!changeReason.trim()) return;
    const ok = await rollbackVersion(versionId, changeReason);
    if (ok) setChangeReason('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex items-center gap-3 text-slate-500">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading AI admin controls...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">AI Admin Agent</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Govern global banking assistant prompt lifecycle with approval and rollback controls.
          </p>
        </div>
        <button
          onClick={refresh}
          className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <p className="text-xs text-slate-500">Current Published</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {currentVersion ? `v${currentVersion.version_number}` : 'No published version'}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <p className="text-xs text-slate-500">In Review</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{reviewQueue.length} version(s)</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <p className="text-xs text-slate-500">Total Versions</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{versions.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <div className="flex items-center gap-2 text-slate-700">
          <Bot className="w-4 h-4" />
          <h3 className="text-sm font-semibold">{editorLabel}</h3>
        </div>
        <textarea
          rows={10}
          value={populatedPrompt}
          onChange={(e) => setPromptText(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          placeholder="Update the global banking assistant prompt..."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={changeReason}
            onChange={(e) => setChangeReason(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            placeholder="Change reason (required)"
          />
          <input
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            placeholder="Reviewer notes (optional)"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onSaveDraft}
            disabled={saving || !changeReason.trim()}
            className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium disabled:opacity-50"
          >
            Save Draft
          </button>
          <button
            onClick={onSubmitReview}
            disabled={saving || !latestDraft || !changeReason.trim()}
            className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium disabled:opacity-50"
          >
            Submit For Review
          </button>
          <button
            onClick={onPublish}
            disabled={saving || approvedQueue.length === 0 || !changeReason.trim()}
            className="px-3 py-2 rounded-xl border border-emerald-200 text-emerald-700 text-sm font-medium disabled:opacity-50"
          >
            <Upload className="w-4 h-4 inline-block mr-1" />
            Publish Approved
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center gap-2 mb-3 text-slate-700">
            <ShieldCheck className="w-4 h-4" />
            <h3 className="text-sm font-semibold">Review Queue</h3>
          </div>
          <div className="space-y-3">
            {reviewQueue.length === 0 ? (
              <p className="text-sm text-slate-500">No drafts pending review.</p>
            ) : (
              reviewQueue.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 p-3">
                  <p className="text-sm font-semibold text-slate-900">Version v{item.version_number}</p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.change_reason}</p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => onApprove(item.id)}
                      disabled={saving || !changeReason.trim()}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => onReject(item.id)}
                      disabled={saving || !changeReason.trim()}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-red-200 text-red-700 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center gap-2 mb-3 text-slate-700">
            <History className="w-4 h-4" />
            <h3 className="text-sm font-semibold">Version History</h3>
          </div>
          <div className="space-y-3 max-h-[420px] overflow-auto pr-1">
            {versions.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">v{item.version_number}</p>
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">{item.status}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{new Date(item.updated_at).toLocaleString()}</p>
                <p className="text-xs text-slate-600 mt-2 line-clamp-2">{item.change_reason}</p>
                {item.id !== currentVersion?.id && (
                  <button
                    onClick={() => onRollback(item.id)}
                    disabled={saving || !changeReason.trim()}
                    className="mt-3 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-amber-200 text-amber-700 disabled:opacity-50"
                  >
                    <Undo2 className="w-3 h-3 inline-block mr-1" />
                    Rollback To This
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Audit Timeline</h3>
        <div className="space-y-2 max-h-72 overflow-auto pr-1">
          {auditLog.length === 0 ? (
            <p className="text-sm text-slate-500">No audit events yet.</p>
          ) : (
            auditLog.map((event) => (
              <div key={event.id} className="rounded-lg border border-slate-200 px-3 py-2">
                <p className="text-xs font-medium text-slate-800">{event.action}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {event.actor_role ?? 'unknown-role'} • {new Date(event.created_at).toLocaleString()}
                </p>
                {event.reason && <p className="text-xs text-slate-600 mt-1">{event.reason}</p>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
