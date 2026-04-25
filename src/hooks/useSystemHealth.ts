import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import type { SystemMetric, SystemAlert, ErrorLog, MetricType } from '../lib/types';

export interface CurrentMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  latency: number;
  requestTime: number;
}

interface MetricsResponse {
  data: SystemMetric[];
  current: CurrentMetrics;
}

interface AlertsResponse {
  data: SystemAlert[];
  unresolved: SystemAlert[];
  criticalCount: number;
  warningCount: number;
}

interface ErrorsResponse {
  data: ErrorLog[];
}

export function useSystemHealth() {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [current, setCurrent] = useState<CurrentMetrics>({
    cpu: 0, memory: 0, disk: 0, network: 0, latency: 0, requestTime: 0,
  });
  const [loading, setLoading] = useState(true);
  const [unresolvedAlerts, setUnresolvedAlerts] = useState<SystemAlert[]>([]);
  const [criticalCount, setCriticalCount] = useState(0);
  const [warningCount, setWarningCount] = useState(0);

  const fetchAll = useCallback(async () => {
    setLoading(true);

    try {
      const [metricsRes, alertsRes, errorsRes] = await Promise.all([
        api.get<MetricsResponse>('/system/metrics'),
        api.get<AlertsResponse>('/system/alerts'),
        api.get<ErrorsResponse>('/system/errors'),
      ]);

      setMetrics(metricsRes.data ?? []);
      setCurrent(metricsRes.current);
      setAlerts(alertsRes.data ?? []);
      setUnresolvedAlerts(alertsRes.unresolved ?? []);
      setCriticalCount(alertsRes.criticalCount ?? 0);
      setWarningCount(alertsRes.warningCount ?? 0);
      setErrorLogs(errorsRes.data ?? []);
    } catch {
      setMetrics([]);
      setAlerts([]);
      setErrorLogs([]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const resolveAlert = async (id: string) => {
    await api.put(`/system/alerts/${id}/resolve`, {});
    await fetchAll();
  };

  const getMetricHistory = useCallback(
    (type: MetricType) => metrics.filter((m) => m.metric_type === type),
    [metrics]
  );

  return {
    metrics,
    alerts,
    errorLogs,
    current,
    loading,
    refetch: fetchAll,
    resolveAlert,
    getMetricHistory,
    unresolvedAlerts,
    criticalCount,
    warningCount,
  };
}
