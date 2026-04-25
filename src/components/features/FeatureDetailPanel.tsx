import { useState } from 'react';
import { X, Save, Shield, Clock, Link, AlertTriangle, Check } from 'lucide-react';
import { FeatureIcon } from './FeatureIcon';
import type { FeatureFlag, FeatureCategory } from '../../lib/types';

interface FeatureDetailPanelProps {
  feature: FeatureFlag;
  onClose: () => void;
  onToggle: () => void;
  onSaveConfig: (config: Record<string, string>) => Promise<boolean>;
  hasUnmetDeps: boolean;
  unmetDepNames: string[];
  dependencyNames: string[];
}

const categoryLabels: Record<FeatureCategory, string> = {
  core: 'Core Module',
  integration: 'Integration',
  analytics: 'Analytics & Reporting',
  experimental: 'Experimental',
};

const roleLabels: Record<string, string> = {
  admin: 'Administrators',
  editor: 'Editors and above',
  viewer: 'All authenticated users',
};

function formatConfigKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function FeatureDetailPanel({
  feature,
  onClose,
  onToggle,
  onSaveConfig,
  hasUnmetDeps,
  unmetDepNames,
  dependencyNames,
}: FeatureDetailPanelProps) {
  const [editedConfig, setEditedConfig] = useState<Record<string, string>>({ ...feature.config });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const configChanged = JSON.stringify(editedConfig) !== JSON.stringify(feature.config);

  const handleSave = async () => {
    setSaving(true);
    const ok = await onSaveConfig(editedConfig);
    setSaving(false);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <>
      {/* Mobile/tablet overlay */}
      <div className="xl:hidden fixed inset-0 z-40" onClick={onClose}>
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
      </div>

      <div className="fixed xl:relative right-0 top-0 bottom-0 z-50 xl:z-auto w-full max-w-md xl:max-w-none xl:w-auto bg-white xl:bg-transparent shadow-2xl xl:shadow-none animate-slide-in-right xl:animate-none overflow-y-auto">
        <div className="xl:bg-white xl:rounded-2xl xl:border xl:border-slate-100 xl:overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 bg-white z-10 px-6 py-5 border-b border-slate-100">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`p-2.5 rounded-xl ${feature.enabled ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'} transition-colors`}>
                  <FeatureIcon name={feature.icon} className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-slate-900">{feature.name}</h3>
                  <span className="text-xs text-slate-500">{categoryLabels[feature.category]}</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Status toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <p className="text-sm font-medium text-slate-700">Feature Status</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {feature.enabled ? 'This feature is active and available to users' : 'This feature is currently disabled'}
                </p>
              </div>
              <button
                onClick={onToggle}
                disabled={hasUnmetDeps && !feature.enabled}
                className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${
                  hasUnmetDeps && !feature.enabled
                    ? 'bg-slate-200 cursor-not-allowed'
                    : feature.enabled
                      ? 'bg-emerald-500'
                      : 'bg-slate-300 hover:bg-slate-400'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${
                    feature.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Unmet deps warning */}
            {hasUnmetDeps && !feature.enabled && (
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Dependencies Required</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Enable these features first: {unmetDepNames.join(', ')}
                  </p>
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">About</h4>
              <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Access</span>
                </div>
                <p className="text-sm font-medium text-slate-900">{roleLabels[feature.required_role] ?? feature.required_role}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Updated</span>
                </div>
                <p className="text-sm font-medium text-slate-900">{formatDate(feature.updated_at)}</p>
              </div>
            </div>

            {/* Dependencies */}
            {dependencyNames.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Link className="w-3.5 h-3.5 text-slate-400" />
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dependencies</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {dependencyNames.map((name) => (
                    <span key={name} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-xs font-medium text-slate-700">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Configuration */}
            {Object.keys(feature.config).length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Configuration</h4>
                  {configChanged && (
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
                    >
                      {saving ? (
                        'Saving...'
                      ) : saved ? (
                        <><Check className="w-3 h-3" /> Saved</>
                      ) : (
                        <><Save className="w-3 h-3" /> Save Changes</>
                      )}
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {Object.entries(editedConfig).map(([key, value]) => {
                    const isBool = value === 'true' || value === 'false';
                    return (
                      <div key={key}>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          {formatConfigKey(key)}
                        </label>
                        {isBool ? (
                          <button
                            type="button"
                            onClick={() =>
                              setEditedConfig({
                                ...editedConfig,
                                [key]: value === 'true' ? 'false' : 'true',
                              })
                            }
                            className={`relative w-10 h-5.5 rounded-full transition-colors ${
                              value === 'true' ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow-sm transition-transform ${
                                value === 'true' ? 'translate-x-[18px]' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        ) : (
                          <input
                            type="text"
                            value={value}
                            onChange={(e) =>
                              setEditedConfig({ ...editedConfig, [key]: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
