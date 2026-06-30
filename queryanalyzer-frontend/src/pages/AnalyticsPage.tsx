import { useApp } from '../context/AppContext';
import { useAnalytics, useSlowQueries, useN1Patterns } from '../hooks/useAnalytics';
import { PieChart, Clock, Database, AlertCircle, TrendingUp, Layers } from 'lucide-react';

export default function AnalyticsPage() {
  const { activeApp } = useApp();
  
  // For simplicity, we fetch "today"
  const today = new Date().toISOString().split('T')[0];
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics(activeApp?.id || null, today, today);
  const { data: slowQueries, isLoading: slowQueriesLoading } = useSlowQueries(activeApp?.id || null);
  const { data: n1Patterns, isLoading: n1Loading } = useN1Patterns(activeApp?.id || null);

  if (!activeApp) {
    return (
      <div className="p-6 sm:p-8 md:p-10">
        <h1 className="text-2xl font-bold mb-4 text-foreground">Analytics</h1>
        <p className="text-muted-foreground">Please select or create an application to view analytics.</p>
      </div>
    );
  }

  const isLoading = analyticsLoading || slowQueriesLoading || n1Loading;

  return (
    <div className="p-6 sm:p-8 md:p-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 sm:text-3xl">
            <PieChart className="w-6 h-6 text-purple-500" />
            Analytics & Insights
          </h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">Deep dive into query performance and patterns</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40 text-muted-foreground">
          Loading analytics...
        </div>
      ) : (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Total Queries', value: analytics?.summary.totalQueries || 0, icon: Database, color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { label: 'Avg Latency', value: `${analytics?.summary.avgDurationMs.toFixed(1) || 0} ms`, icon: Clock, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'P95 Latency', value: `${analytics?.summary.p95DurationMs?.toFixed(1) || 0} ms`, icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-500/10' },
              { label: 'N+1 Patterns', value: n1Patterns?.length || 0, icon: Layers, color: 'text-rose-500', bg: 'bg-rose-500/10' },
            ].map((stat, i) => (
              <div key={i} className="p-6 rounded-xl border border-border bg-card shadow-sm flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{stat.label}</p>
                  <h4 className="text-xl font-bold tracking-tight text-foreground">{stat.value}</h4>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Top 5 N+1 Patterns */}
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
