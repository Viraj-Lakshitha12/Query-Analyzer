import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useQueries } from '../hooks/useQueries';
import QueryDrawer from '../components/QueryDrawer';
import { Database, Search, Clock, FileText, ChevronLeft, ChevronRight } from 'lucide-react';

export default function QueryExplorerPage() {
  const { activeApp } = useApp();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'SLOW' | 'N+1'>('ALL');
  const [selectedQueryId, setSelectedQueryId] = useState<string | null>(null);

  const { data: queriesPage, isLoading } = useQueries(activeApp?.id || null, {
    page,
    size: 20,
    search: search || undefined,
    status: activeFilter === 'SLOW' ? 'SLOW' : undefined,
    hasIssues: activeFilter === 'N+1' ? true : undefined
  });

  if (!activeApp) {
    return (
      <div className="p-6 sm:p-8 md:p-10">
        <h1 className="text-2xl font-bold mb-4 text-foreground">Query Explorer</h1>
        <p className="text-muted-foreground">Please select or create an application to view queries.</p>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 md:p-10 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 sm:text-3xl">
            <Database className="w-6 h-6 text-blue-500" />
            Query Explorer
          </h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">Browse and search historical queries</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl flex-1 flex flex-col overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="p-6 border-b border-border flex flex-col sm:flex-row gap-4 bg-card">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search SQL or tables..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-base h-11 pl-10 pr-4 py-3 bg-input border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow"
            />
          </div>
          <div className="flex gap-2">
            {(['ALL', 'SLOW', 'N+1'] as const).map(f => (
              <button
                key={f}
                onClick={() => { setActiveFilter(f); setPage(0); }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeFilter === f 
                    ? 'bg-blue-500 text-white shadow-sm' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto bg-card flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">Loading queries...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/40 sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  <th className="p-3 border-b border-border">Time</th>
                  <th className="p-3 border-b border-border">Type</th>
                  <th className="p-3 border-b border-border">Table</th>
                  <th className="p-3 border-b border-border">Duration</th>
                  <th className="p-3 border-b border-border">Issues</th>
                  <th className="p-3 border-b border-border">SQL Snippet</th>
                </tr>
              </thead>
              <tbody>
                {!queriesPage?.content.length ? (
                  <tr>
                    <td colSpan={6} className="p-3 text-sm text-center text-muted-foreground border-b border-border/60 align-middle">
                      <FileText className="w-8 h-8 mx-auto mb-3 opacity-50" />
                      No queries found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  queriesPage.content.map((q) => (
                    <tr 
                      key={q.id} 
                      onClick={() => setSelectedQueryId(q.id)}
                      className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors duration-200 group"
                    >
                      <td className="text-sm p-3 text-muted-foreground border-b border-border/60 align-middle whitespace-nowrap">
                        {new Date(q.capturedAt).toLocaleString()}
                      </td>
                      <td className="text-sm p-3 text-foreground border-b border-border/60 align-middle whitespace-nowrap">
                        <span className={`px-3 py-1 rounded text-sm font-mono border ${
                          q.queryType === 'SELECT' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                          q.queryType === 'INSERT' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                          q.queryType === 'UPDATE' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                          q.queryType === 'DELETE' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                          'bg-muted text-foreground border-border group-hover:border-primary/20'
                        } transition-colors`}>
                          {q.queryType}
                        </span>
                      </td>
                      <td className="text-sm p-3 text-foreground border-b border-border/60 align-middle whitespace-nowrap">
                        {q.tableName || '-'}
                      </td>
                      <td className="text-sm p-3 text-foreground border-b border-border/60 align-middle whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className={`px-2 py-1 rounded text-sm font-medium ${
                            q.durationMs < 100 ? 'text-emerald-500 bg-emerald-500/10' :
                            q.durationMs <= 500 ? 'text-amber-500 bg-amber-500/10' :
                            'text-rose-500 bg-rose-500/10'
                          }`}>
                            {q.durationMs.toFixed(1)}ms
                          </span>
                        </div>
                      </td>
                      <td className="text-sm p-3 text-foreground border-b border-border/60 align-middle whitespace-nowrap">
                        {q.issueCount > 0 ? (
                          <span className="px-3 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-full text-sm font-medium shadow-sm">
                            {q.issueCount} Issue(s)
                          </span>
                        ) : (
                          <span className="text-muted-foreground font-mono">-</span>
                        )}
                      </td>
                      <td className="p-3 text-foreground border-b border-border/60 align-middle" title={q.sqlText}>
                        <div className="text-sm font-mono truncate max-w-sm xl:max-w-xl text-muted-foreground group-hover:text-foreground transition-colors">
                          {q.sqlText}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="p-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-6 bg-card">
          <span className="text-base text-muted-foreground">
            Showing page {page + 1} of {queriesPage?.totalPages || 1}
          </span>
          <div className="flex items-center gap-2">
            <button 
              disabled={page === 0}
              onClick={() => setPage(p => Math.max(0, p - 1))}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 disabled:hover:bg-transparent transition-colors border border-border sm:border-transparent"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              disabled={queriesPage?.last || !queriesPage}
              onClick={() => setPage(p => p + 1)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 disabled:hover:bg-transparent transition-colors border border-border sm:border-transparent"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Query Details Drawer */}
      <QueryDrawer 
        queryId={selectedQueryId} 
        onClose={() => setSelectedQueryId(null)} 
      />
    </div>
  );
}
