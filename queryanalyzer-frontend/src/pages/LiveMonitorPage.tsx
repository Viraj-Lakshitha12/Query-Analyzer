import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useWebSocket } from '../hooks/useWebSocket';
import api from '../api/axiosClient';
import type { AnalyticsDTO } from '../types';
import { Activity, Database, AlertCircle, Clock } from 'lucide-react';

export default function Dashboard() {
  const { activeApp } = useApp();
  const { liveQueries, clearFeed } = useWebSocket(activeApp?.id || null);
  const [analytics, setAnalytics] = useState<AnalyticsDTO | null>(null);

  useEffect(() => {
    if (!activeApp) return;
    const fetchAnalytics = async () => {
      const today = new Date().toISOString().split('T')[0];
      const res = await api.get(`/apps/${activeApp.id}/analytics?from=${today}&to=${today}`);
      setAnalytics(res.data);
    };
    fetchAnalytics();
  }, [activeApp]);

  if (!activeApp) {
    return (
      <div className="p-6 sm:p-8 md:p-10">
        <h1 className="text-2xl font-bold mb-4 text-foreground">Welcome to QueryLens</h1>
        <p className="text-muted-foreground">Please create an application in Settings to get started.</p>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 md:p-10 h-full overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Dashboard Overview</h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">Real-time metrics for {activeApp.name}</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 w-fit">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Live Monitoring Active</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Queries Today', value: analytics?.summary.totalQueries || 0, icon: Database, color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-500/10' },
          { 
            label: 'Avg Latency', 
            value: `${analytics?.summary.avgDurationMs.toFixed(2) || 0} ms`, 
            icon: Activity, 
            color: (analytics?.summary.avgDurationMs || 0) < 50 ? 'text-emerald-500 dark:text-emerald-400' : (analytics?.summary.avgDurationMs || 0) <= 200 ? 'text-amber-500 dark:text-amber-400' : 'text-rose-500 dark:text-rose-400', 
            bg: (analytics?.summary.avgDurationMs || 0) < 50 ? 'bg-emerald-500/10' : (analytics?.summary.avgDurationMs || 0) <= 200 ? 'bg-amber-500/10' : 'bg-rose-500/10' 
          },
          { 
            label: 'P95 Latency', 
            value: `${analytics?.summary.p95DurationMs?.toFixed(2) || 0} ms`, 
            icon: Clock, 
            color: (analytics?.summary.p95DurationMs || 0) < 50 ? 'text-emerald-500 dark:text-emerald-400' : (analytics?.summary.p95DurationMs || 0) <= 200 ? 'text-amber-500 dark:text-amber-400' : 'text-rose-500 dark:text-rose-400', 
            bg: (analytics?.summary.p95DurationMs || 0) < 50 ? 'bg-emerald-500/10' : (analytics?.summary.p95DurationMs || 0) <= 200 ? 'bg-amber-500/10' : 'bg-rose-500/10' 
          },
          { 
            label: 'N+1 Issues', 
            value: analytics?.summary.n1Detections || 0, 
            icon: AlertCircle, 
            color: (analytics?.summary.n1Detections || 0) > 0 ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-500 dark:text-emerald-400', 
            bg: (analytics?.summary.n1Detections || 0) > 0 ? 'bg-rose-500/10' : 'bg-emerald-500/10' 
          },
        ].map((stat, i) => (
          <div key={i} className="p-8 sm:p-10 rounded-xl border border-border bg-card text-card-foreground shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-muted-foreground text-base font-medium">{stat.label}</span>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <div className={`text-4xl font-bold tracking-tight ${stat.color.split(' ')[0].replace('text-', 'text-')}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Live Queries Table */}
      <div className="w-full overflow-x-auto border border-border rounded-xl bg-card shadow-sm flex flex-col" style={{ height: '400px' }}>
        <div className="p-6 sm:p-8 border-b border-border flex justify-between items-center bg-card">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Live Query Feed</h2>
            <p className="text-sm text-muted-foreground mt-1">Showing last {liveQueries.length} queries</p>
          </div>
          <button 
            onClick={clearFeed}
            className="px-4 py-2 text-sm font-medium rounded-md bg-muted hover:bg-muted/80 text-foreground transition-colors"
          >
            Clear feed
          </button>
        </div>
        <div className="w-full overflow-x-auto bg-card flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/40 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="p-3 border-b border-border">Time</th>
                <th className="p-3 border-b border-border">Status</th>
                <th className="p-3 border-b border-border">Duration</th>
                <th className="p-3 border-b border-border">Query</th>
              </tr>
            </thead>
            <tbody>
              {liveQueries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-3 text-sm text-muted-foreground border-b border-border/60 align-middle text-center">
                    Listening for incoming queries... (Make sure your backend and agent are running)
                  </td>
                </tr>
              ) : (
                liveQueries.map((q, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors duration-150 group">
                    <td className="text-sm p-3 text-muted-foreground border-b border-border/60 align-middle whitespace-nowrap">
                      {new Date(q.capturedAt).toLocaleTimeString()}
                    </td>
                    <td className="text-sm p-3 text-foreground border-b border-border/60 align-middle whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                        q.status === 'FAST' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 
                        q.status === 'SLOW' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' : 
                        'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                      }`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="text-sm p-3 text-foreground border-b border-border/60 align-middle whitespace-nowrap font-mono">
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        q.durationMs < 100 ? 'text-emerald-500 bg-emerald-500/10' :
                        q.durationMs <= 500 ? 'text-amber-500 bg-amber-500/10' :
                        'text-rose-500 bg-rose-500/10'
                      }`}>
                        {q.durationMs}ms
                      </span>
                    </td>
                    <td className="p-3 text-foreground border-b border-border/60 align-middle" title={q.sqlText}>
                      <div className="text-sm font-mono leading-relaxed bg-zinc-950 text-zinc-50 p-4 rounded-xl border border-zinc-800 overflow-x-auto shadow-inner max-w-2xl">
                        {q.sqlText}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
