import { Cpu, HardDrive, Wifi, Clock, Zap, MemoryStick, RefreshCw, Bell, FileWarning, Activity } from 'lucide-react';
import { useSystemHealth } from '../hooks/useSystemHealth';
import { GaugeCard } from '../components/monitoring/GaugeCard';
import { AlertsFeed } from '../components/monitoring/AlertsFeed';
import { ErrorLogFeed } from '../components/monitoring/ErrorLogFeed';
import { PerformanceChart } from '../components/monitoring/PerformanceChart';

export function SystemMonitoring() {
  const {
    current,
    alerts,
    errorLogs,
    loading,
    refetch,
    resolveAlert,
    getMetricHistory,
    unresolvedAlerts,
    criticalCount,
    warningCount,
  } = useSystemHealth();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex items-center gap-3 text-slate-500">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading system metrics...</span>
        </div>
      </div>
    );
  }

  const overallHealth = criticalCount > 0 ? 'critical' : warningCount > 0 ? 'degraded' : 'healthy';
  const healthConfig = {
    healthy: { color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', label: 'All Systems Operational' },
    degraded: { color: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50', label: 'Performance Degraded' },
    critical: { color: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50', label: 'Critical Issues Detected' },
  }[overallHealth];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">System Monitoring</h2>
          <p className="text-sm text-slate-500 mt-0.5">Real-time infrastructure health and performance</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${healthConfig.bg}`}>
            <div className={`w-2 h-2 rounded-full ${healthConfig.color} animate-pulse`} />
            <span className={`text-xs font-medium ${healthConfig.text}`}>{healthConfig.label}</span>
          </div>
          <button
            onClick={refetch}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* System Status Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <GaugeCard
          label="CPU"
          value={current.cpu}
          unit="%"
          icon={<Cpu className="w-4 h-4" />}
          color="#0ea5e9"
          detail="8 cores, Intel Xeon E5-2686"
        />
        <GaugeCard
          label="Memory"
          value={current.memory}
          unit="%"
          icon={<MemoryStick className="w-4 h-4" />}
          color="#8b5cf6"
          detail="22 GB / 32 GB used"
        />
        <GaugeCard
          label="Disk"
          value={current.disk}
          unit="%"
          icon={<HardDrive className="w-4 h-4" />}
          color="#f59e0b"
          detail="340 GB / 500 GB used"
        />
        <GaugeCard
          label="Network"
          value={current.network}
          unit="Mbps"
          maxValue={1000}
          icon={<Wifi className="w-4 h-4" />}
          color="#10b981"
          detail="Interface: eth0, Max: 1 Gbps"
        />
      </div>

      {/* Quick stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Avg Latency', value: `${current.latency}ms`, icon: Clock, color: 'text-sky-600', bg: 'bg-sky-50' },
          { label: 'Req Time', value: `${current.requestTime}ms`, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Active Alerts', value: unresolvedAlerts.length.toString(), icon: Bell, color: criticalCount > 0 ? 'text-red-600' : 'text-slate-600', bg: criticalCount > 0 ? 'bg-red-50' : 'bg-slate-50' },
          { label: 'Error Rate', value: `${errorLogs.filter((l) => l.level === 'error').length}`, icon: FileWarning, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-sky-500" />
              <h3 className="text-sm font-semibold text-slate-900">CPU Usage (24h)</h3>
            </div>
            <span className="text-xs text-slate-400">{current.cpu}% current</span>
          </div>
          <PerformanceChart data={getMetricHistory('cpu')} label="cpu" color="#0ea5e9" height={200} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MemoryStick className="w-4 h-4 text-violet-500" />
              <h3 className="text-sm font-semibold text-slate-900">Memory Usage (24h)</h3>
            </div>
            <span className="text-xs text-slate-400">{current.memory}% current</span>
          </div>
          <PerformanceChart data={getMetricHistory('memory')} label="memory" color="#8b5cf6" height={200} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-slate-900">Latency (24h)</h3>
            </div>
            <span className="text-xs text-slate-400">{current.latency}ms current</span>
          </div>
          <PerformanceChart data={getMetricHistory('latency')} label="latency" color="#f59e0b" height={200} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-semibold text-slate-900">Network Throughput (24h)</h3>
            </div>
            <span className="text-xs text-slate-400">{current.network} Mbps current</span>
          </div>
          <PerformanceChart data={getMetricHistory('network')} label="network" color="#10b981" height={200} />
        </div>
      </div>

      {/* Alerts + Error Logs */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Alerts */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-900">Alerts</h3>
            </div>
            <div className="flex items-center gap-2">
              {criticalCount > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-[10px] font-medium">
                  {criticalCount} critical
                </span>
              )}
              {warningCount > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-medium">
                  {warningCount} warning
                </span>
              )}
            </div>
          </div>
          <div className="max-h-[460px] overflow-y-auto">
            <AlertsFeed alerts={alerts} onResolve={resolveAlert} />
          </div>
        </div>

        {/* Error logs */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-900">Error Logs</h3>
            </div>
            <span className="text-xs text-slate-400">{errorLogs.length} entries</span>
          </div>
          <ErrorLogFeed logs={errorLogs} />
        </div>
      </div>
    </div>
  );
}
