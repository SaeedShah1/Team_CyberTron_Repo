import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import type { FeatureFlag, FeatureCategory } from '../lib/types';

interface FeaturesResponse {
  data: FeatureFlag[];
}

export function useFeatures() {
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<FeatureCategory | 'all'>('all');
  const [search, setSearch] = useState('');

  const fetchFeatures = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<FeaturesResponse>('/features');
      setFeatures(res.data ?? []);
    } catch {
      setFeatures([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  const toggleFeature = async (id: string, currentEnabled: boolean) => {
    setFeatures((prev) =>
      prev.map((f) => (f.id === id ? { ...f, enabled: !currentEnabled } : f))
    );

    try {
      await api.put(`/features/${id}/toggle`, {});
    } catch {
      setFeatures((prev) =>
        prev.map((f) => (f.id === id ? { ...f, enabled: currentEnabled } : f))
      );
    }
  };

  const updateConfig = async (id: string, config: Record<string, string>) => {
    try {
      await api.put(`/features/${id}/config`, { config });
      setFeatures((prev) =>
        prev.map((f) => (f.id === id ? { ...f, config } : f))
      );
      return true;
    } catch {
      return false;
    }
  };

  const filtered = features.filter((f) => {
    if (categoryFilter !== 'all' && f.category !== categoryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        f.name.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.slug.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const categories = [...new Set(features.map((f) => f.category))].sort();
  const enabledCount = features.filter((f) => f.enabled).length;
  const totalCount = features.length;

  const getDependencyNames = useCallback(
    (deps: string[]) =>
      deps
        .map((slug) => features.find((f) => f.slug === slug)?.name ?? slug)
        .filter(Boolean),
    [features]
  );

  const hasUnmetDependencies = useCallback(
    (feature: FeatureFlag) =>
      feature.dependencies.some(
        (slug) => !features.find((f) => f.slug === slug)?.enabled
      ),
    [features]
  );

  return {
    features: filtered,
    allFeatures: features,
    loading,
    categoryFilter,
    setCategoryFilter,
    search,
    setSearch,
    toggleFeature,
    updateConfig,
    categories,
    enabledCount,
    totalCount,
    getDependencyNames,
    hasUnmetDependencies,
    refetch: fetchFeatures,
  };
}
