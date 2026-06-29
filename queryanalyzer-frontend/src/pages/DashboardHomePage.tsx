import { useState } from 'react';
import { useApp } from '../context/AppContext';
import api from '../api/axiosClient';
import { Plus, Code2, Copy, Check, Server, Terminal, Settings } from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardHomePage() {
  const { apps, activeApp, setActiveApp, refreshApps, isLoading } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modal State
  const [newAppName, setNewAppName] = useState('');
  const [newAppEnv, setNewAppEnv] = useState('DEV');
  const [newAppThreshold, setNewAppThreshold] = useState('200');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.post('/apps', {
        name: newAppName,
        environment: newAppEnv,
        slowQueryThresholdMs: parseInt(newAppThreshold, 10),
      });
      await refreshApps();
      setIsModalOpen(false);
      
      // Reset form
      setNewAppName('');
      setNewAppEnv('DEV');
      setNewAppThreshold('200');

      toast.success('Application created successfully!');
      toast('Your SDK Key', {
        description: res.data.sdkKey,
        action: {
          label: 'Copy',
          onClick: () => handleCopy(res.data.sdkKey),
        },
        duration: 10000,
      });

    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
    toast.success('Copied to clipboard');
  };

  if (isLoading && apps.length === 0) {
    return (
      <div className="p-6 sm:p-8 md:p-10 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 md:p-10 h-full overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Applications</h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">Manage your monitored environments and SDK keys.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-md transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Application
        </button>
      </div>

      {apps.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center shadow-sm">
          <Server className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">No applications found</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Get started by creating your first application. You'll receive an SDK key to securely connect your backend.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600/10 text-blue-500 hover:bg-blue-600/20 font-medium px-4 py-2 rounded-md transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Application
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app) => (
            <div 
              key={app.id} 
              className={`bg-card border rounded-xl p-6 transition-all w-full max-w-full cursor-pointer
                ${activeApp?.id === app.id ? 'border-blue-500 shadow-md ring-1 ring-blue-500/20' : 'border-border hover:border-border hover:shadow-sm'}`}
              onClick={() => setActiveApp(app)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-lg shrink-0 ${activeApp?.id === app.id ? 'bg-blue-500/10 text-blue-500' : 'bg-muted text-muted-foreground'}`}>
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
                      {app.name}
                      {activeApp?.id === app.id && (
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                      )}
                    </h3>
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                        <Terminal className="w-3 h-3" />
                        {app.environment}
                      </span>
                      {activeApp?.id === app.id ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                          </span>
                          Active View
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border">
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground"></span>
                          Offline
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button className="text-muted-foreground hover:text-foreground transition-colors p-1">
                  <Settings className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 mt-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">SDK Key</label>
                  <div className="flex items-center gap-4">
                    <code className="flex-1 bg-input/50 px-3 py-2 rounded-lg border border-border text-sm font-mono text-foreground truncate w-full">
                      {app.sdkKey}
                    </code>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(app.sdkKey);
                      }}
                      className="p-2 border border-border rounded-md hover:bg-input/50 transition-colors text-muted-foreground hover:text-foreground"
                      title="Copy SDK Key"
                    >
                      {copiedKey === app.sdkKey ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm text-muted-foreground bg-input/30 px-3 py-2 rounded-md">
                  <span>Slow Threshold</span>
                  <span className="font-mono text-foreground">{app.slowQueryThresholdMs}ms</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create App Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-card border border-border rounded-xl shadow-sm w-full max-w-md p-8 sm:p-10 animate-in fade-in zoom-in-95 duration-200 text-card-foreground">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-blue-500" />
                  New Application
                </h2>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">Create an app to get your SDK credentials.</p>
              </div>
            </div>

            <form onSubmit={handleCreateApp} className="space-y-5">
              <div>
                <label className="block text-base font-medium text-foreground mb-1.5">Application Name</label>
                <input
                  type="text"
                  required
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                  className="w-full text-base h-11 px-4 py-3 bg-input border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow"
                  placeholder="e.g., Auth Service API"
                />
              </div>

              <div>
                <label className="block text-base font-medium text-foreground mb-1.5">Environment</label>
                <select
                  value={newAppEnv}
                  onChange={(e) => setNewAppEnv(e.target.value)}
                  className="w-full text-base h-11 px-4 py-3 bg-input border border-input rounded-lg text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow"
                >
                  <option value="DEV">Development</option>
                  <option value="STAGING">Staging</option>
                  <option value="PROD">Production</option>
                </select>
              </div>

              <div>
                <label className="block text-base font-medium text-foreground mb-1.5">Slow Query Threshold (ms)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newAppThreshold}
                  onChange={(e) => setNewAppThreshold(e.target.value)}
                  className="w-full text-base h-11 px-4 py-3 bg-input border border-input rounded-lg text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow"
                  placeholder="200"
                />
                <p className="text-base text-muted-foreground mt-2 leading-relaxed">Queries taking longer than this will be flagged as slow.</p>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-input/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md text-base font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? 'Creating...' : 'Create Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
