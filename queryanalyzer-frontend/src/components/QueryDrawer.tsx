import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useQueryDetails, useExplainAi } from '../hooks/useQueries';
import { X, Clock, Database, Hash, AlertTriangle, Play, Sparkles } from 'lucide-react';

interface QueryDrawerProps {
  queryId: string | null;
  onClose: () => void;
}

export default function QueryDrawer({ queryId, onClose }: QueryDrawerProps) {
  const { activeApp } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  // Animate drawer open/close
  useEffect(() => {
    if (queryId) setIsOpen(true);
    else setIsOpen(false);
  }, [queryId]);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 300); // Wait for transition
  };

  const { data: query, isLoading } = useQueryDetails(activeApp?.id || null, queryId);
  const { mutate: explainAi, isPending: isExplaining } = useExplainAi();

  if (!queryId) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 z-40 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleClose}
      />
      
      {/* Drawer */}
      <div 
        className={`fixed inset-y-0 right-0 w-full max-w-2xl bg-card border-l border-border shadow-2xl transition-transform duration-300 ease-in-out z-50 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-10">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Play className="w-5 h-5 text-blue-500" />
            Query Execution Details
          </h2>
          <button 
            onClick={handleClose}
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
              Loading details...
            </div>
          ) : !query ? (
            <div className="text-center text-rose-500 py-12">Failed to load query details.</div>
          ) : (
            <>
              {/* Meta Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/50 border border-border p-4 rounded-xl">
                  <div className="text-muted-foreground text-xs mb-1 flex items-center gap-1.5 uppercase font-semibold tracking-wider">
                    <Clock className="w-3.5 h-3.5" /> Duration
                  </div>
                  <div className={`text-xl font-mono ${query.status === 'SLOW' ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {query.durationMs}ms
                  </div>
                </div>
                <div className="bg-muted/50 border border-border p-4 rounded-xl">
                  <div className="text-muted-foreground text-xs mb-1 flex items-center gap-1.5 uppercase font-semibold tracking-wider">
                    <Database className="w-3.5 h-3.5" /> Table
                  </div>
                  <div className="text-lg text-foreground truncate" title={query.tableName}>
                    {query.tableName || 'N/A'}
                  </div>
                </div>
                <div className="bg-muted/50 border border-border p-4 rounded-xl">
                  <div className="text-muted-foreground text-xs mb-1 flex items-center gap-1.5 uppercase font-semibold tracking-wider">
                    <Hash className="w-3.5 h-3.5" /> Type
                  </div>
                  <div className="text-lg text-foreground">
                    {query.queryType}
                  </div>
                </div>
                <div className="bg-muted/50 border border-border p-4 rounded-xl">
                  <div className="text-muted-foreground text-xs mb-1 flex items-center gap-1.5 uppercase font-semibold tracking-wider">
                    <AlertTriangle className="w-3.5 h-3.5" /> Issues
                  </div>
                  <div className={`text-lg ${query.issueCount > 0 ? 'text-rose-500 font-bold' : 'text-muted-foreground'}`}>
                    {query.issueCount}
                  </div>
                </div>
              </div>

              {/* SQL Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">SQL Statement</h3>
                <div className="bg-muted/50 border border-border rounded-xl p-4 overflow-x-auto relative group">
                  <pre className="text-sm text-blue-600 dark:text-blue-400 font-mono whitespace-pre-wrap leading-relaxed">
                    {query.sqlText}
                  </pre>
                  <button 
                    onClick={() => navigator.clipboard.writeText(query.sqlText)}
                    className="absolute top-2 right-2 p-2 bg-card text-muted-foreground hover:text-foreground rounded-md opacity-0 group-hover:opacity-100 transition-opacity border border-border shadow-lg cursor-pointer"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Execution Plan */}
              {query.executionPlan && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Execution Plan</h3>
                  <div className="bg-muted/50 border border-border rounded-xl p-4 flex flex-col gap-4">
                    <div className="flex gap-4 flex-wrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        query.executionPlan.scanType === 'SEQ_SCAN' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      }`}>
                        {query.executionPlan.scanType}
                      </span>
                      <span className="text-sm text-muted-foreground flex items-center">Rows Scanned: <span className="text-foreground font-mono ml-1.5">{query.executionPlan.rowsScanned}</span></span>
                      <span className="text-sm text-muted-foreground flex items-center">Total Cost: <span className="text-foreground font-mono ml-1.5">{query.executionPlan.totalCost}</span></span>
                    </div>
                    <div className="bg-background border border-border rounded-xl p-3 overflow-x-auto text-xs font-mono text-muted-foreground">
                      <pre>
                        {(() => {
                          try {
                            return JSON.stringify(JSON.parse(query.executionPlan.planJson), null, 2);
                          } catch (e) {
                            return query.executionPlan.planJson;
                          }
                        })()}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* Issues */}
              {(query.issues?.length ?? 0) > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Detected Issues</h3>
                  <div className="space-y-3">
                    {query.issues.map(issue => (
                      <div key={issue.id} className={`p-4 rounded-xl border-l-4 bg-muted/30 border border-border ${
                        issue.severity === 'CRITICAL' ? 'border-l-rose-500' :
                        issue.severity === 'HIGH' ? 'border-l-orange-500' :
                        issue.severity === 'MEDIUM' ? 'border-l-amber-500' :
                        'border-l-muted-foreground'
                      }`}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                             <span className="text-sm font-mono bg-muted px-2 py-0.5 rounded text-foreground border border-border">{issue.issueType}</span>
                             <span className="text-xs font-medium text-muted-foreground">{issue.severity}</span>
                          </div>
                          {!issue.aiSuggestion && (
                            <button 
                              onClick={() => activeApp && explainAi({ appId: activeApp.id, queryId: query.id, issueId: issue.id })}
                              disabled={isExplaining}
                              className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 px-3 py-1.5 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {isExplaining ? 'Analyzing...' : 'Explain with AI'}
                            </button>
                          )}
                        </div>
                        <div className="text-sm text-foreground/80 mb-3">{issue.ruleSuggestion}</div>
                        {issue.aiSuggestion && (
                          <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-4">
                            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" /> AI Analysis
                            </div>
                            <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{issue.aiSuggestion}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Captured At */}
              <div className="text-xs text-muted-foreground text-right">
                Captured on {new Date(query.capturedAt).toLocaleString()}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
