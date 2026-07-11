import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useAnalytics, useSlowQueries, useN1Patterns } from '../hooks/useAnalytics';
import { Clock, Database, AlertCircle, TrendingUp, Layers, BarChart3, Activity } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

export default function AnalyticsPage() {
  const { activeApp } = useApp();

  // Date range: default to last 7 days
  const [rangeDays, setRangeDays] = useState(7);

  const { from, to } = useMemo(() => {
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(toDate.getDate() - rangeDays);
    return {
      from: fromDate.toISOString().split('T')[0],
      to: toDate.toISOString().split('T')[0],
    };
  }, [rangeDays]);

  const { data: analytics, isLoading: analyticsLoading } = useAnalytics(activeApp?.id || null, from, to);
  const { data: slowQueries, isLoading: slowQueriesLoading } = useSlowQueries(activeApp?.id || null);
  const { data: n1Patterns, isLoading: n1Loading } = useN1Patterns(activeApp?.id || null);

  // Format dailyStats for charts
  const chartData = useMemo(() => {
    if (!analytics?.dailyStats?.length) return [];
    return analytics.dailyStats.map(d => ({
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      rawDate: d.date,
      total: d.total,
      slow: d.slow,
      avgMs: Number(d.avgMs?.toFixed(1) ?? 0),
    }));
  }, [analytics]);

  if (!activeApp) {
    return (
      <div className="p-6 sm:p-8 md:p-10">
        <h1 className="text-2xl font-bold mb-4 text-foreground">Analytics</h1>
        <p className="text-muted-foreground">Please select or create an application to view analytics.</p>
      </div>
    );
  }

  const isLoading = analyticsLoading || slowQueriesLoading || n1Loading;

  // Custom tooltip for charts
  const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold text-foreground mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="text-muted-foreground">
            <span className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
            {entry.name}: <span className="font-medium text-foreground">{entry.value}{entry.name.includes('Latency') ? ' ms' : ''}</span>
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 sm:p-8 md:p-10 h-full overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 sm:text-3xl">
            <BarChart3 className="w-6 h-6 text-purple-500" />
            Analytics &amp; Insights
          </h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">Deep dive into query performance and patterns</p>
        </div>
        {/* Date Range Selector */}
        <div className="flex gap-2">
          {[
            { label: '7D', days: 7 },
            { label: '14D', days: 14 },
            { label: '30D', days: 30 },
            { label: '90D', days: 90 },
          ].map(opt => (
            <button
              key={opt.days}
              onClick={() => setRangeDays(opt.days)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                rangeDays === opt.days
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40 text-muted-foreground">
          Loading analytics...
        </div>
      ) : (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Total Queries', value: analytics?.summary.totalQueries || 0, icon: Database, color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { label: 'Slow Queries', value: analytics?.summary.slowQueries || 0, icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
              { label: 'Avg Latency', value: `${analytics?.summary.avgDurationMs?.toFixed(1) || 0} ms`, icon: Clock, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'P95 Latency', value: `${analytics?.summary.p95DurationMs?.toFixed(1) || 0} ms`, icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-500/10' },
              { label: 'N+1 Patterns', value: n1Patterns?.length || 0, icon: Layers, color: 'text-rose-500', bg: 'bg-rose-500/10' },
            ].map((stat, i) => (
              <div key={i} className="p-5 rounded-xl border border-border bg-card shadow-sm flex items-center gap-4">
                <div className={`p-2.5 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">{stat.label}</p>
                  <h4 className="text-lg font-bold tracking-tight text-foreground">{stat.value}</h4>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          {chartData.length > 0 && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Query Volume Chart */}
              <div className="bg-card border border-border rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Activity className="w-5 h-5 text-blue-500" />
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">Query Volume</h2>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradientTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradientSlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      name="Total Queries"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="url(#gradientTotal)"
                      dot={false}
                      activeDot={{ r: 4, fill: '#3b82f6', stroke: 'hsl(var(--card))' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="slow"
                      name="Slow Queries"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      fill="url(#gradientSlow)"
                      dot={false}
                      activeDot={{ r: 4, fill: '#f59e0b', stroke: 'hsl(var(--card))' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Average Latency Chart */}
              <div className="bg-card border border-border rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Clock className="w-5 h-5 text-emerald-500" />
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">Average Latency (ms)</h2>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradientLatency" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.4} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      unit=" ms"
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar
                      dataKey="avgMs"
                      name="Avg Latency"
                      fill="url(#gradientLatency)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* No Data Placeholder for charts */}
          {chartData.length === 0 && (
            <div className="bg-card border border-border rounded-xl shadow-sm p-12 text-center">
              <BarChart3 className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">No query data in the selected date range. Try widening the range or generating some queries.</p>
            </div>
          )}

          {/* Tables Row */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Top N+1 Patterns */}
            <div className="bg-card border border-border rounded-xl shadow-sm flex flex-col overflow-hidden">
              <div className="p-6 border-b border-border bg-card">
                <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-500" />
                  Top N+1 Patterns
                </h2>
              </div>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/40">
                    <tr>
                      <th className="p-3 border-b border-border whitespace-nowrap">Table</th>
                      <th className="p-3 border-b border-border whitespace-nowrap">Occurrences</th>
                      <th className="p-3 border-b border-border min-w-[200px]">Pattern</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!n1Patterns?.length ? (
                      <tr>
                        <td colSpan={3} className="p-8 text-center text-muted-foreground">No N+1 patterns detected!</td>
                      </tr>
                    ) : (
                      n1Patterns.slice(0, 5).map((p, i) => (
                        <tr key={i} className="hover:bg-muted/30 transition-colors border-b border-border/60 group">
                          <td className="p-3 align-middle font-medium text-foreground whitespace-nowrap">{p.tableName || 'Unknown'}</td>
                          <td className="p-3 align-middle">
                            <span className="px-2.5 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-full text-sm font-medium">
                              {p.occurrences}
                            </span>
                          </td>
                          <td className="p-3 align-middle text-sm font-mono text-muted-foreground group-hover:text-foreground transition-colors truncate max-w-xs">
                            {p.pattern}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Slow Queries */}
            <div className="bg-card border border-border rounded-xl shadow-sm flex flex-col overflow-hidden">
              <div className="p-6 border-b border-border bg-card">
                <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  Top Slow Queries
                </h2>
              </div>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/40">
                    <tr>
                      <th className="p-3 border-b border-border whitespace-nowrap">Type</th>
                      <th className="p-3 border-b border-border whitespace-nowrap">Duration</th>
                      <th className="p-3 border-b border-border min-w-[200px]">SQL Snippet</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!slowQueries?.length ? (
                      <tr>
                        <td colSpan={3} className="p-8 text-center text-muted-foreground">No slow queries recorded.</td>
                      </tr>
                    ) : (
                      slowQueries.slice(0, 5).map((q) => (
                        <tr key={q.id} className="hover:bg-muted/30 transition-colors border-b border-border/60 group">
                          <td className="p-3 align-middle">
                            <span className="px-2.5 py-1 bg-muted text-foreground rounded text-xs font-mono border border-border">
                              {q.queryType}
                            </span>
                          </td>
                          <td className="p-3 align-middle whitespace-nowrap">
                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                              {q.durationMs.toFixed(1)}ms
                            </span>
                          </td>
                          <td className="p-3 align-middle text-sm font-mono text-muted-foreground group-hover:text-foreground transition-colors truncate max-w-xs" title={q.sqlText}>
                            {q.sqlText}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
