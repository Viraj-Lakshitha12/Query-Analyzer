import { useState } from "react";
import { useApp } from "../context/AppContext";
import api from "../api/axiosClient";
import {
  Plus,
  Code2,
  Copy,
  Check,
  Server,
  Terminal,
  Settings,
  Activity,
  Database,
  Zap,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

export default function DashboardHomePage() {
  const { apps, activeApp, setActiveApp, refreshApps, isLoading } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modal State
  const [newAppName, setNewAppName] = useState("");
  const [newAppEnv, setNewAppEnv] = useState("DEV");
  const [newAppThreshold, setNewAppThreshold] = useState("200");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete App State
  const [appToDelete, setAppToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.post("/apps", {
        name: newAppName,
        environment: newAppEnv,
        slowQueryThresholdMs: parseInt(newAppThreshold, 10),
      });
      await refreshApps();
      setIsModalOpen(false);

      // Reset form
      setNewAppName("");
      setNewAppEnv("DEV");
      setNewAppThreshold("200");

      toast.success("Application created successfully!");
      toast("Your SDK Key", {
        description: res.data.sdkKey,
        action: {
          label: "Copy",
          onClick: () => handleCopy(res.data.sdkKey),
        },
        duration: 10000,
      });
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Failed to create application",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
    toast.success("Copied to clipboard");
  };

  const handleDeleteApp = async () => {
    if (!appToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/apps/${appToDelete.id}`);
      await refreshApps();
      setAppToDelete(null);
      toast.success("Application deleted successfully!");
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Failed to delete application",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading && apps.length === 0) {
    return (
      <div className="p-6 sm:p-8 md:p-10 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 md:p-10 h-full overflow-y-auto overflow-x-hidden relative bg-background">
      {/* ── Background Ambience ── */}
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-blue-500/5 dark:from-blue-600/10 to-transparent pointer-events-none" />
      <div className="absolute top-[-100px] right-[-100px] w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

      {/* ── Header ── */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6 mb-10 auth-fade-up-1">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Zap className="w-3.5 h-3.5" />
            Environment Overview
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Applications
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl leading-relaxed">
            Manage your monitored database environments, configure thresholds,
            and retrieve SDK keys for backend integration.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium px-5 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg shadow-blue-500/25 active:scale-95 cursor-pointer auth-btn-glow"
        >
          <Plus className="w-4 h-4" />
          New Application
        </button>
      </div>

      {/* ── Dashboard Stats (Fills empty space) ── */}
      {apps.length > 0 && (
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 auth-fade-up-2">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:border-blue-500/50 transition-colors">
            <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Total Apps
              </p>
              <h4 className="text-xl font-bold text-foreground mt-0.5">
                {apps.length}
              </h4>
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:border-emerald-500/50 transition-colors">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Active Monitor
              </p>
              <h4 className="text-xl font-bold text-foreground mt-0.5 truncate max-w-[120px]">
                {activeApp ? activeApp.name : "None"}
              </h4>
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:border-indigo-500/50 transition-colors">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Infrastructure
              </p>
              <h4 className="text-xl font-bold text-foreground mt-0.5">
                Healthy
              </h4>
            </div>
          </div>
        </div>
      )}

      {/* ── Apps Grid ── */}
      {apps.length === 0 ? (
        <div className="relative z-10 w-full max-w-3xl mx-auto mt-12 bg-white/60 dark:bg-[#0B0F19]/60 backdrop-blur-xl border border-border rounded-3xl p-12 text-center shadow-2xl auth-fade-up-2">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent rounded-3xl pointer-events-none" />
          <div className="relative flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <Server className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">
            No applications found
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
            Get started by creating your first application. You'll receive a
            secure SDK key to connect your backend architecture and begin
            monitoring queries instantly.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 hover:bg-blue-600/20 dark:hover:bg-blue-500/30 font-semibold px-6 py-3 rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Initialize First App
          </button>
        </div>
      ) : (
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auth-fade-up-3">
          {apps.map((app) => (
            <div
              key={app.id}
              className={`group relative overflow-hidden bg-card border rounded-2xl p-6 transition-all duration-300 cursor-pointer shadow-sm
                ${
                  activeApp?.id === app.id
                    ? "border-blue-500 shadow-xl shadow-blue-500/10 scale-[1.02]"
                    : "border-border hover:border-blue-500/50 hover:shadow-lg hover:scale-[1.01]"
                }`}
              onClick={() => setActiveApp(app)}
            >
              {/* Active app background glow */}
              {activeApp?.id === app.id && (
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
              )}

              <div className="flex justify-between items-start mb-5 relative z-10">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`p-2.5 rounded-lg shrink-0 transition-colors ${activeApp?.id === app.id ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md" : "bg-muted text-muted-foreground group-hover:bg-blue-500/10 group-hover:text-blue-500"}`}
                  >
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
                      {app.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        <Terminal className="w-3 h-3" />
                        {app.environment}
                      </span>
                    </div>
                  </div>
                </div>
                {activeApp?.id === app.id ? (
                  <span
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500"
                    title="Active"
                  >
                    <Check className="w-4 h-4" />
                  </span>
                ) : (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button className="text-muted-foreground hover:text-blue-500 transition-colors p-1 cursor-pointer" title="Settings">
                      <Settings className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setAppToDelete(app);
                      }}
                      className="text-muted-foreground hover:text-rose-500 transition-colors p-1 cursor-pointer" 
                      title="Delete App"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Status Ribbon */}
              <div className="flex items-center gap-2 mb-6 relative z-10">
                {activeApp?.id === app.id ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Monitoring Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full border border-border">
                    <span className="h-2 w-2 rounded-full bg-slate-400"></span>
                    Offline
                  </span>
                )}
              </div>

              <div className="space-y-4 pt-4 border-t border-border/60 relative z-10">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                    SDK Key (Protected)
                  </label>
                  <div className="flex items-center gap-2 group/key">
                    <code className="flex-1 bg-input/50 px-3 py-2.5 rounded-lg border border-border text-xs font-mono text-foreground truncate w-full filter blur-[3px] hover:blur-none transition-all duration-300 cursor-text select-all">
                      {app.sdkKey}
                    </code>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(app.sdkKey);
                      }}
                      className="p-2.5 bg-input/50 border border-border rounded-lg hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-500/20 dark:hover:border-blue-500/30 transition-colors text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                      title="Copy SDK Key"
                    >
                      {copiedKey === app.sdkKey ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Slow Threshold
                  </span>
                  <span className="font-mono text-foreground font-semibold bg-muted px-2 py-0.5 rounded-md border border-border">
                    {app.slowQueryThresholdMs}ms
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create App Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsModalOpen(false)}
          ></div>
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-8 animate-in fade-in zoom-in-95 duration-200 text-foreground">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center gap-3 mb-8 relative z-10">
              <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                <Code2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">
                  New Application
                </h2>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">
                  Configure Environment
                </p>
              </div>
            </div>

            <form
              onSubmit={handleCreateApp}
              className="space-y-5 relative z-10"
            >
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Application Name
                </label>
                <input
                  type="text"
                  required
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                  className="w-full text-sm h-11 px-4 bg-input/50 border border-border rounded-xl text-foreground placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  placeholder="e.g., Auth Service API"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Environment
                </label>
                <div className="relative">
                  <select
                    value={newAppEnv}
                    onChange={(e) => setNewAppEnv(e.target.value)}
                    className="w-full appearance-none text-sm h-11 px-4 bg-input/50 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="DEV">Development</option>
                    <option value="STAGING">Staging</option>
                    <option value="PROD">Production</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      ></path>
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Slow Query Threshold (ms)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="1"
                    value={newAppThreshold}
                    onChange={(e) => setNewAppThreshold(e.target.value)}
                    className="w-full text-sm h-11 px-4 pr-12 bg-input/50 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-mono"
                    placeholder="200"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground pointer-events-none">
                    MS
                  </span>
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:text-accent-foreground hover:bg-accent transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  {isSubmitting ? "Provisioning..." : "Initialize App"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {appToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
            onClick={() => setAppToDelete(null)}
          ></div>
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-8 animate-in fade-in zoom-in-95 duration-200 text-foreground">
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Delete Application
                </h2>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mb-6 relative z-10 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-foreground">{appToDelete.name}</span>? 
              This will permanently remove all associated analytics, queries, and issues. This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3 relative z-10">
              <button
                type="button"
                onClick={() => setAppToDelete(null)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteApp}
                disabled={isDeleting}
                className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-rose-500/25 disabled:opacity-50 flex items-center gap-2 cursor-pointer active:scale-95"
              >
                {isDeleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
