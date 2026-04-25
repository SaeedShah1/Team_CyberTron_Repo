import { ChevronRight, AlertTriangle, Shield } from 'lucide-react';
import { FeatureIcon } from './FeatureIcon';
import type { FeatureFlag, FeatureCategory } from '../../lib/types';

interface FeatureCardProps {
  feature: FeatureFlag;
  onToggle: () => void;
  onSelect: () => void;
  hasUnmetDeps: boolean;
  unmetDepNames: string[];
}

const categoryColors: Record<FeatureCategory, { bg: string; text: string; dot: string }> = {
  core: { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-500' },
  integration: { bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-500' },
  analytics: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  experimental: { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
};

const roleLabels: Record<string, string> = {
  admin: 'Admin only',
  editor: 'Editor+',
  viewer: 'All users',
};

export function FeatureCard({ feature, onToggle, onSelect, hasUnmetDeps, unmetDepNames }: FeatureCardProps) {
  const cat = categoryColors[feature.category];

  return (
    <div
      className={`bg-white rounded-2xl border transition-all hover:shadow-md group ${
        feature.enabled ? 'border-slate-200' : 'border-slate-100'
      }`}
    >
      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2.5 rounded-xl ${feature.enabled ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'} transition-colors`}>
              <FeatureIcon name={feature.icon} className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-900 truncate">{feature.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${cat.bg} ${cat.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
                  {feature.category}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Shield className="w-2.5 h-2.5" />
                  {roleLabels[feature.required_role] ?? feature.required_role}
                </span>
              </div>
            </div>
          </div>

          {/* Toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            disabled={hasUnmetDeps && !feature.enabled}
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
              hasUnmetDeps && !feature.enabled
                ? 'bg-slate-200 cursor-not-allowed'
                : feature.enabled
                  ? 'bg-emerald-500'
                  : 'bg-slate-300 hover:bg-slate-400'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                feature.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-3">
          {feature.description}
        </p>

        {/* Unmet deps warning */}
        {hasUnmetDeps && !feature.enabled && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100 mb-3">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-[11px] text-amber-700 leading-snug">
              Requires: {unmetDepNames.join(', ')}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${feature.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            <span className={`text-xs font-medium ${feature.enabled ? 'text-emerald-700' : 'text-slate-400'}`}>
              {feature.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <button
            onClick={onSelect}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 transition-colors"
          >
            Configure
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
