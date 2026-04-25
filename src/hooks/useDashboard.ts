import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import type { ManagedUser, ActivityLog, DashboardMetrics, DateRange } from '../lib/types';

interface DashboardResponse {
  metrics: DashboardMetrics;
  activities: ActivityLog[];
  users: ManagedUser[];
  usersByDay: { date: string; count: number }[];
  activityByType: { action: string; count: number }[];
}

export function useDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [loading, setLoading] = useState(true);
  const [cachedUsersByDay, setCachedUsersByDay] = useState<{ date: string; count: number }[]>([]);
  const [cachedActivityByType, setCachedActivityByType] = useState<{ action: string; count: number }[]>([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<DashboardResponse>(`/dashboard?range=${dateRange}`);
      setMetrics(res.metrics);
      setActivities(res.activities);
      setUsers(res.users);
      setCachedUsersByDay(res.usersByDay);
      setCachedActivityByType(res.activityByType);
    } catch {
      setMetrics(null);
      setActivities([]);
      setUsers([]);
    }
    setLoading(false);
  }, [dateRange]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const usersByDay = useCallback(() => cachedUsersByDay, [cachedUsersByDay]);
  const activityByType = useCallback(() => cachedActivityByType, [cachedActivityByType]);

  return {
    metrics,
    activities,
    users,
    dateRange,
    setDateRange,
    loading,
    refetch: fetchAll,
    usersByDay,
    activityByType,
  };
}
