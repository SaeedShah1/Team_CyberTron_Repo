import { useState } from 'react';
import { RefreshCw, Search, X, ToggleRight, Blocks, Zap, BarChart3, FlaskConical } from 'lucide-react';
import { useFeatures } from '../hooks/useFeatures';
import { FeatureCard } from '../components/features/FeatureCard';
import { FeatureDetailPanel } from '../components/features/FeatureDetailPanel';
import type { FeatureFlag, FeatureCategory } from '../lib/types';

const categoryConfig: Record<FeatureCategory, { label: string; icon: typeof Blocks; color: string; bg: string }> = {
  core: { label: 'Core', icon: Blocks, color: 'text-slate-700', bg: 'bg-slate-100' },
  integration: { label: 'Integrations', icon: Zap, color: 'text-sky-700', bg: 'bg-sky-50' },
  analytics: { label: 'Analytics', icon: BarChart3, color: 'text-amber-700', bg: 'bg-amber-50' },
  experimental: { label: 'Experimental', icon: FlaskConical, color: 'text-rose-700', bg: 'bg-rose-50' },
};

export function FeatureConfiguration() {
  const {
    features,
    allFeatures,
    loading,
    categoryFilter,
    setCategoryFilter,
    search,
    setSearch,
    toggleFeature,
    updateConfig,
    enabledCount,
    totalCount,
    getDependencyNames,
    hasUnmetDependencies,
    refetch,
  } = useFeatures();

  const [selectedFeature, setSelectedFeature] = useState<FeatureFlag | null>(null);

  const handleToggle = (feature: FeatureFlag) => {
    toggleFeature(feature.id, feature.enabled);
    if (selectedFeature?.id === feature.id) {
      setSelectedFeature({ ...feature, enabled: !feature.enabled });
    }
  };

  const handleSaveConfig = async (config: Record<string, string>) => {
    if (!selectedFeature) return false;
    const ok = await updateConfig(selectedFeature.id, config);
    if (ok) {
      setSelectedFeature({ ...selectedFeature, config });
    }
    return ok;
  };

  // Keep selected feature in sync with latest data
  const liveSelected = selectedFeature
    ? allFeatures.find((f) => f.id === selectedFeature.id) ?? selectedFeature
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex items-center gap-3 text-slate-500">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading features...</span>
        </div>
      </div>
    );
  }

  const categoryCounts = allFeatures.reduce<Record<string, { total: number; enabled: number }>>((acc, f) => {
    if (!acc[f.category]) acc[f.category] = { total: 0, enabled: 0 };
    acc[f.category].total++;
    if (f.enabled) acc[f.category].enabled++;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Feature Configuration</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {enabledCount} of {totalCount} features enabled
          </p>
        </div>
        <button
          onClick={refetch}
          className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(Object.entries(categoryConfig) as [FeatureCategory, typeof categoryConfig[FeatureCategory]][]).map(
          ([cat, cfg]) => {
            const counts = categoryCounts[cat] ?? { total: 0, enabled: 0 };
            const Icon = cfg.icon;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(categoryFilter === cat ? 'all' : cat)}
                className={`bg-white rounded-xl border p-4 flex items-center gap-3 transition-all text-left ${
                  categoryFilter === cat
                    ? 'border-slate-900 shadow-sm ring-1 ring-slate-900'
                    : 'border-slate-100 hover:shadow-md'
                }`}
              >
                <div className={`p-2 rounded-lg ${cfg.bg}`}>
                  <Icon className={`w-4 h-4 ${cfg.color}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{cfg.label}</p>
                  <p className="text-xs text-slate-500">
                    {counts.enabled}/{counts.total} active
                  </p>
                </div>
              </button>
            );
          }
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search features by name or description..."
          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Content: cards + detail panel */}
      <div className="flex gap-6 items-start">
        {/* Feature grid */}
        <div className="flex-1 min-w-0">
          {features.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-slate-100">
              <ToggleRight className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-900">No features found</p>
              <p className="text-xs text-slate-500 mt-1">Try a different search or category filter.</p>
            </div>
          ) : (
            <>
              {/* Category groups */}
              {categoryFilter === 'all' ? (
                (Object.keys(categoryConfig) as FeatureCategory[]).map((cat) => {
                  const catFeatures = features.filter((f) => f.category === cat);
                  if (catFeatures.length === 0) return null;
                  const cfg = categoryConfig[cat];
                  const Icon = cfg.icon;
                  return (
                    <div key={cat} className="mb-6 last:mb-0">
                      <div className="flex items-center gap-2 mb-3">
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                        <h3 className="text-sm font-semibold text-slate-700">{cfg.label}</h3>
                        <span className="text-xs text-slate-400">
                          ({catFeatures.filter((f) => f.enabled).length}/{catFeatures.length})
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-3">
                        {catFeatures.map((feature) => (
                          <FeatureCard
                            key={feature.id}
                            feature={feature}
                            onToggle={() => handleToggle(feature)}
                            onSelect={() => setSelectedFeature(feature)}
                            hasUnmetDeps={hasUnmetDependencies(feature)}
                            unmetDepNames={getDependencyNames(
                              feature.dependencies.filter(
                                (slug) => !allFeatures.find((f) => f.slug === slug)?.enabled
                              )
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-3">
                  {features.map((feature) => (
                    <FeatureCard
                      key={feature.id}
                      feature={feature}
                      onToggle={() => handleToggle(feature)}
                      onSelect={() => setSelectedFeature(feature)}
                      hasUnmetDeps={hasUnmetDependencies(feature)}
                      unmetDepNames={getDependencyNames(
                        feature.dependencies.filter(
                          (slug) => !allFeatures.find((f) => f.slug === slug)?.enabled
                        )
                      )}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Desktop detail panel */}
        {liveSelected && (
          <div className="hidden xl:block w-[380px] shrink-0 sticky top-6">
            <FeatureDetailPanel
              feature={liveSelected}
              onClose={() => setSelectedFeature(null)}
              onToggle={() => handleToggle(liveSelected)}
              onSaveConfig={handleSaveConfig}
              hasUnmetDeps={hasUnmetDependencies(liveSelected)}
              unmetDepNames={getDependencyNames(
                liveSelected.dependencies.filter(
                  (slug) => !allFeatures.find((f) => f.slug === slug)?.enabled
                )
              )}
              dependencyNames={getDependencyNames(liveSelected.dependencies)}
            />
          </div>
        )}
      </div>

      {/* Mobile/Tablet detail panel overlay */}
      {liveSelected && (
        <div className="xl:hidden">
          <FeatureDetailPanel
            feature={liveSelected}
            onClose={() => setSelectedFeature(null)}
            onToggle={() => handleToggle(liveSelected)}
            onSaveConfig={handleSaveConfig}
            hasUnmetDeps={hasUnmetDependencies(liveSelected)}
            unmetDepNames={getDependencyNames(
              liveSelected.dependencies.filter(
                (slug) => !allFeatures.find((f) => f.slug === slug)?.enabled
              )
            )}
            dependencyNames={getDependencyNames(liveSelected.dependencies)}
          />
        </div>
      )}
    </div>
  );
}
