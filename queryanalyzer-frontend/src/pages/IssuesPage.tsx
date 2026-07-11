import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useIssues, useResolveIssue } from '../hooks/useIssues';
import { AlertTriangle, CheckCircle2, Search, RefreshCw } from 'lucide-react';

export default function IssuesPage() {
  const { activeApp } = useApp();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'N+1' | 'Missing Index' | 'Resolved'>('All');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  
  const { data: issues, isLoading, isFetching, refetch } = useIssues(activeApp?.id || null);
  const { mutate: resolveIssue, isPending: isResolving } = useResolveIssue();

  const activeIssues = issues?.filter(i => !i.resolved) || [];
  const criticalCount = activeIssues.filter(i => i.severity === 'CRITICAL').length;
  const highCount = activeIssues.filter(i => i.severity === 'HIGH').length;
  const mediumCount = activeIssues.filter(i => i.severity === 'MEDIUM').length;

  const filteredIssues = issues?.filter(issue => {
    // Type filter
    if (activeTab === 'Resolved' && !issue.resolved) return false;
    if (activeTab !== 'Resolved' && issue.resolved) return false;
    if (activeTab === 'N+1' && issue.issueType !== 'N_PLUS_ONE') return false;
    if (activeTab === 'Missing Index' && issue.issueType !== 'MISSING_INDEX') return false;

    // Severity filter (AND with type)
    if (severityFilter !== 'ALL' && issue.severity !== severityFilter) return false;

    if (search) {
      const s = search.toLowerCase();
      return issue.issueType.toLowerCase().includes(s) || 
             issue.ruleSuggestion.toLowerCase().includes(s);
    }
    return true;
  });

  if (!activeApp) {
    return (
      <div className="p-6 sm:p-8 md:p-10">
        <h1 className="text-2xl font-bold mb-4 text-foreground">Issues</h1>
        <p className="text-muted-foreground">Please select or create an application to view performance issues.</p>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 md:p-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 sm:text-3xl">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
            Performance Issues
          </h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">Detected anomalies and anti-patterns in your queries</p>
        </div>
        {!isLoading && (
          <div className="text-sm font-medium bg-muted/50 border border-border px-4 py-2 rounded-lg">
            <span className="text-foreground">{activeIssues.length} active issues</span>
            <span className="text-muted-foreground ml-2">
              ({criticalCount} critical, {highCount} high, {mediumCount} medium)
            </span>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl flex-1 flex flex-col overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="p-6 border-b border-border flex flex-col sm:flex-row gap-6 bg-card">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search issues..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-input border border-input rounded-md pl-9 pr-4 py-3 text-base text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-shadow"
            />
          </div>
          <div className="flex flex-col gap-3">
            {/* Severity filter chips */}
            <div className="flex gap-2 items-center">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mr-1">Severity:</span>
              {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(sev => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer border ${
                    severityFilter === sev
                      ? sev === 'ALL' ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                        : sev === 'CRITICAL' ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                        : sev === 'HIGH' ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                        : sev === 'MEDIUM' ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                        : 'bg-sky-500 text-white border-sky-500 shadow-sm'
                      : 'bg-muted text-muted-foreground border-border hover:bg-muted/80 hover:text-foreground'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
            {/* Type filter chips */}
            <div className="flex gap-2 items-center">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mr-1">Type:</span>
              {(['All', 'N+1', 'Missing Index', 'Resolved'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === tab 
                      ? 'bg-blue-500 text-white shadow-sm' 
                      : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  }`}
                >
                  {tab}
                </button>
              ))}
              <div className="w-px bg-border mx-1 self-stretch" />
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="px-4 py-1.5 rounded-md text-xs font-medium transition-colors bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">Loading issues...</div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/40">
                <tr>
                  <th className="p-3 border-b border-border whitespace-nowrap">Detected</th>
                  <th className="p-3 border-b border-border whitespace-nowrap">Issue Type</th>
                  <th className="p-3 border-b border-border whitespace-nowrap">Severity</th>
                  <th className="p-3 border-b border-border min-w-[300px]">Description</th>
                  <th className="p-3 border-b border-border whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody>
                {!filteredIssues?.length ? (
                  <tr>
                    <td colSpan={5} className="p-3 text-sm text-center text-muted-foreground border-b border-border/60 align-middle">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-3 text-emerald-500/50" />
                      No performance issues detected!
                    </td>
                  </tr>
                ) : (
                  filteredIssues.map((issue) => (
                    <tr
                      key={issue.id}
                      className={`cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors duration-200 group border-l-4 ${
                        issue.severity === 'CRITICAL' ? 'border-l-rose-500' :
                        issue.severity === 'HIGH' ? 'border-l-orange-500' :
                        issue.severity === 'MEDIUM' ? 'border-l-amber-500' :
                        'border-l-slate-400'
                      }`}
                    >
                      <td className="text-sm p-3 text-muted-foreground border-b border-border/60 align-middle whitespace-nowrap pl-6">
                        {new Date(issue.createdAt).toLocaleString()}
                      </td>
                      <td className="text-sm p-3 text-foreground border-b border-border/60 align-middle whitespace-nowrap">
                        <span className="px-2.5 py-1 bg-muted text-foreground rounded text-xs font-mono border border-border">
                          {issue.issueType}
                        </span>
                      </td>
                      <td className="text-sm p-3 text-foreground border-b border-border/60 align-middle whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                          issue.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' :
                          issue.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' :
                          issue.severity === 'MEDIUM' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                          'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                        }`}>
                          {issue.severity}
                        </span>
                      </td>
                      <td className="p-3 text-foreground border-b border-border/60 align-top">
                        <div className="text-sm leading-relaxed">
                          {issue.ruleSuggestion}
                        </div>
                        {issue.aiSuggestion && (
                          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">AI: {issue.aiSuggestion}</div>
                        )}
                      </td>
                      <td className="text-sm p-3 text-foreground border-b border-border/60 align-middle whitespace-nowrap">
                        {issue.resolved ? (
                          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                            <CheckCircle2 className="w-4 h-4" /> Resolved
                          </span>
                        ) : (
                          <button
                            onClick={() => resolveIssue({ appId: activeApp.id, issueId: issue.id })}
                            disabled={isResolving}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Resolve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
