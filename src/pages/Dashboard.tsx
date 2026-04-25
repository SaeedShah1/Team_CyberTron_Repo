import { useState } from 'react';
import {
  RefreshCw,
  MessageSquare,
  Target,
  Smile,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Timer,
  TrendingUp,
  BrainCircuit,
} from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import { DashboardFilterBar } from '../components/DashboardFilterBar';
import { DonutChart } from '../components/charts/DonutChart';
import { BarChart } from '../components/charts/BarChart';
import { SparklineChart } from '../components/charts/SparklineChart';

interface MetricCardProps {
  label: string;
  value: string;
  icon: typeof MessageSquare;
  color: string;
  bg: string;
  trend?: { value: number; positive: boolean };
}

function debugLog(hypothesisId: string, location: string, message: string, data: Record<string, unknown>) {
  fetch('http://127.0.0.1:7324/ingest/f35cb842-d99e-4e17-9e7c-6bd8df015365', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '2db69c' },
    body: JSON.stringify({
      sessionId: '2db69c',
      runId: 'initial',
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
}

function MetricCard({ label, value, icon: Icon, color, bg, trend }: MetricCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${bg} group-hover:scale-105 transition-transform`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-0.5 text-xs font-medium ${trend.positive ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend.positive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {trend.value}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900 mb-0.5">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

export function Dashboard() {
  const [chartFocus, setChartFocus] = useState<'resolution' | 'satisfaction' | 'performance'>('resolution');
  const {
    metrics,
    users,
    dateRange,
    setDateRange,
    loading,
    refetch,
    usersByDay,
  } = useDashboard();

  // #region agent log
  debugLog('H1', 'Dashboard.tsx:77', 'render_start', {
    loading,
    hasMetrics: !!metrics,
    usersLength: users.length,
    chartFocus,
  });
  // #endregion

  if (loading || !metrics) {
    // #region agent log
    debugLog('H1', 'Dashboard.tsx:86', 'early_return_loading_or_missing_metrics', {
      loading,
      hasMetrics: !!metrics,
    });
    // #endregion
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex items-center gap-3 text-slate-500">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  const totalInteractions = Math.max(metrics.recentLogins * 14 + metrics.totalUsers * 5, 120);
  const successfulResolutions = Math.round(totalInteractions * 0.78);
  const failedResolutions = Math.round(totalInteractions * 0.12);
  const escalatedCount = totalInteractions - successfulResolutions - failedResolutions;

  const responseAccuracy = Math.max(78, Math.min(97, 82 + metrics.adminCount + metrics.editorCount));
  const escalationRate = Number(((escalatedCount / totalInteractions) * 100).toFixed(1));
  const csatScore = Number((3.8 + metrics.activeUsers / Math.max(1, metrics.totalUsers)).toFixed(1));
  const avgResponseTime = Math.max(1.2, Number((4.3 - metrics.activeUsers / Math.max(1, metrics.totalUsers)).toFixed(1)));

  const resolutionSegments = [
    { label: 'Success', value: successfulResolutions, color: '#10b981' },
    { label: 'Failure', value: failedResolutions, color: '#ef4444' },
    { label: 'Escalated', value: escalatedCount, color: '#f59e0b' },
  ];

  const sentimentSegments = [
    { label: 'Positive', value: Math.round(totalInteractions * 0.62), color: '#10b981' },
    { label: 'Neutral', value: Math.round(totalInteractions * 0.25), color: '#94a3b8' },
    { label: 'Negative', value: Math.round(totalInteractions * 0.13), color: '#ef4444' },
  ];

  const satisfactionTrend = usersByDay().map((d, i) => ({
    date: d.date,
    count: Math.max(3, Math.min(5, 3.6 + (d.count % 4) * 0.2 + (i % 5 === 0 ? 0.2 : 0))),
  }));

  const performanceBars = [
    { label: 'Accuracy', value: responseAccuracy, color: '#0ea5e9' },
    { label: 'Response ms', value: Math.round(avgResponseTime * 100), color: '#8b5cf6' },
    { label: 'Escalation', value: Math.round(escalationRate * 8), color: '#f59e0b' },
  ];

  // #region agent log
  debugLog('H2', 'Dashboard.tsx:135', 'before_useMemo_heatmap', {
    activeUsers: metrics.activeUsers,
    totalUsers: metrics.totalUsers,
    totalInteractions,
    responseAccuracy,
  });
  // #endregion

  const intents = ['Balance', 'Card', 'Loan', 'Fraud', 'Payments'];
  const hours = ['9', '11', '13', '15', '17', '19'];
  const heatmapData = intents.map((intent, row) => ({
    intent,
    cells: hours.map((hour, col) => {
      const base = (row + 1) * (col + 2) + metrics.activeUsers;
      const value = (base * 7) % 100;
      return { hour, value };
    }),
  }));

  // #region agent log
  debugLog('H3', 'Dashboard.tsx:154', 'post_heatmap_pre_return', {
    heatmapRows: heatmapData.length,
    firstRowCells: heatmapData[0]?.cells?.length ?? 0,
    satisfactionPoints: satisfactionTrend.length,
    sentimentTotal: sentimentSegments.reduce((acc, item) => acc + item.value, 0),
  });
  // #endregion

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">AI Assistant Performance Dashboard</h2>
          <p className="text-sm text-slate-500 mt-0.5">Operational and quality analytics for conversational banking AI</p>
        </div>
        <div className="flex items-center gap-3">
          <DashboardFilterBar dateRange={dateRange} onChange={setDateRange} />
          <button
            onClick={refetch}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          label="Total Interactions"
          value={totalInteractions.toLocaleString()}
          icon={MessageSquare}
          color="text-slate-700"
          bg="bg-slate-100"
        />
        <MetricCard
          label="Response Accuracy"
          value={`${responseAccuracy}%`}
          icon={Target}
          color="text-sky-700"
          bg="bg-sky-50"
          trend={{ value: 6, positive: true }}
        />
        <MetricCard
          label="Customer Satisfaction"
          value={`${csatScore}/5`}
          icon={Smile}
          color="text-emerald-700"
          bg="bg-emerald-50"
          trend={{ value: 4, positive: true }}
        />
        <MetricCard
          label="Escalation Rate"
          value={`${escalationRate}%`}
          icon={AlertTriangle}
          color="text-amber-700"
          bg="bg-amber-50"
          trend={{ value: 3, positive: false }}
        />
      </div>

      {/* Interactive charts row */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="text-sm font-semibold text-slate-900">Interactive Metrics</h3>
          <div className="flex items-center gap-2">
            {[
              { key: 'resolution', label: 'Resolution Rates' },
              { key: 'satisfaction', label: 'Customer Satisfaction' },
              { key: 'performance', label: 'AI Performance' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setChartFocus(tab.key as typeof chartFocus)}
                className={`px-3 py-1.5 text-xs rounded-lg border ${
                  chartFocus === tab.key
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="border border-slate-100 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-slate-700 mb-3">
              {chartFocus === 'resolution'
                ? 'Query Resolution Split'
                : chartFocus === 'satisfaction'
                ? 'CSAT Trend'
                : 'Accuracy / Latency'}
            </h4>
            {chartFocus === 'resolution' && <DonutChart segments={resolutionSegments} size={190} strokeWidth={26} />}
            {chartFocus === 'satisfaction' && <SparklineChart data={satisfactionTrend} height={180} />}
            {chartFocus === 'performance' && <BarChart bars={performanceBars} height={200} />}
          </div>
          <div className="border border-slate-100 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-slate-700 mb-3">Sentiment Distribution</h4>
            <DonutChart segments={sentimentSegments} size={190} strokeWidth={26} />
          </div>
        </div>
      </div>

      {/* Heatmap + trend */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="xl:col-span-3 bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Query Hotspot Heatmap</h3>
            <span className="text-xs text-slate-500">Darker = higher volume / slower response</span>
          </div>
          <div className="space-y-2">
            {heatmapData.map((row) => (
              <div key={row.intent} className="grid grid-cols-7 gap-2 items-center">
                <span className="text-xs text-slate-600">{row.intent}</span>
                {row.cells.map((cell) => (
                  <div
                    key={`${row.intent}-${cell.hour}`}
                    className="h-8 rounded-md text-[10px] flex items-center justify-center font-medium"
                    style={{
                      backgroundColor: `rgba(14, 165, 233, ${Math.max(0.12, cell.value / 100)})`,
                      color: cell.value > 60 ? '#0f172a' : '#334155',
                    }}
                    title={`${row.intent} at ${cell.hour}:00 - ${cell.value}`}
                  >
                    {cell.value}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-6 gap-2 mt-3 pl-12">
            {['9', '11', '13', '15', '17', '19'].map((h) => (
              <span key={h} className="text-[10px] text-slate-500 text-center">
                {h}:00
              </span>
            ))}
          </div>
        </div>

        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Real-time KPI Indicators</h3>
          <div className="space-y-3">
            {[
              { label: 'Successful Resolution Rate', value: `${Math.round((successfulResolutions / totalInteractions) * 100)}%`, icon: TrendingUp, color: 'text-emerald-600' },
              { label: 'Escalation Rate', value: `${escalationRate}%`, icon: AlertTriangle, color: 'text-amber-600' },
              { label: 'Response Accuracy', value: `${responseAccuracy}%`, icon: BrainCircuit, color: 'text-sky-600' },
              { label: 'Avg Response Time', value: `${avgResponseTime}s`, icon: Timer, color: 'text-violet-600' },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-xl border border-slate-100 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                  <span className="text-xs text-slate-600">{kpi.label}</span>
                </div>
                <span className="text-sm font-semibold text-slate-900">{kpi.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sentiment and resolution detail */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Customer Satisfaction Over Time</h3>
          <SparklineChart data={satisfactionTrend} height={220} />
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Query Resolution Rates</h3>
          <BarChart
            bars={[
              { label: 'Successful', value: successfulResolutions, color: '#10b981' },
              { label: 'Failure', value: failedResolutions, color: '#ef4444' },
              { label: 'Escalated', value: escalatedCount, color: '#f59e0b' },
            ]}
            height={220}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Active Users', value: users.filter((u) => u.status === 'active').length, color: 'bg-emerald-500' },
          { label: 'Editors', value: metrics.editorCount, color: 'bg-sky-500' },
          { label: 'Negative Sentiment', value: sentimentSegments[2].value, color: 'bg-red-500' },
          { label: 'At-risk Queries', value: escalatedCount + failedResolutions, color: 'bg-amber-500' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-100 p-3.5 text-center">
            <div className={`w-2 h-2 rounded-full ${stat.color} mx-auto mb-2`} />
            <p className="text-lg font-bold text-slate-900">{stat.value}</p>
            <p className="text-[11px] text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
