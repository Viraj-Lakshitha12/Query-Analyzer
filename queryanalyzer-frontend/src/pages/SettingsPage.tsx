import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { updateApp, rotateAppKey, deleteApp } from "../api/apps";
import {
  Settings,
  Copy,
  KeyRound,
  AlertTriangle,
  Loader2,
  Check,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { activeApp, refreshApps } = useApp();
  const navigate = useNavigate();

  // General Settings State
  const [name, setName] = useState("");
  const [environment, setEnvironment] = useState("DEV");
  const [slowQueryThresholdMs, setSlowQueryThresholdMs] = useState(100);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'instructions'>('settings');

  // Key Rotation State
  const [isRotateModalOpen, setIsRotateModalOpen] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync state with active app
  useEffect(() => {
    if (activeApp) {
      setName(activeApp.name);
      setEnvironment(activeApp.environment);
      setSlowQueryThresholdMs(activeApp.slowQueryThresholdMs);
    }
  }, [activeApp]);

  if (!activeApp) {
    return (
      <div className="p-6 sm:p-8 md:p-10 h-full flex flex-col items-center justify-center">
        <div className="bg-card border border-border rounded-2xl p-10 text-center max-w-md shadow-sm">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Settings className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground mb-3">
            No Application Selected
          </h2>
          <p className="text-base text-muted-foreground mb-8 leading-relaxed">
            Please select an application from the sidebar or create a new one on the Apps page to configure settings and view instructions.
          </p>
          <button
            onClick={() => navigate("/")}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-xl text-base font-medium transition-colors shadow-sm"
          >
            Go to Applications
          </button>
        </div>
      </div>
    );
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("App name is required");
      return;
    }
    setIsUpdating(true);
    try {
      await updateApp(activeApp.id, {
        name,
        environment,
        slowQueryThresholdMs,
      });
      await refreshApps();
      toast.success("Settings updated successfully");
    } catch (error) {
      toast.error("Failed to update settings");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRotateKey = async () => {
    setIsRotating(true);
    try {
      await rotateAppKey(activeApp.id);
      await refreshApps();
      setIsRotateModalOpen(false);
      toast.success("SDK Key rotated successfully");
    } catch (error) {
      toast.error("Failed to rotate SDK key");
    } finally {
      setIsRotating(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmName !== activeApp.name) return;
    setIsDeleting(true);
    try {
      await deleteApp(activeApp.id);
      await refreshApps();
      toast.success("Application deleted");
      navigate("/");
    } catch (error) {
      toast.error("Failed to delete application");
      setIsDeleting(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(activeApp.sdkKey);
    setCopied(true);
    toast.success("SDK Key copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 sm:p-8 md:p-10 h-full flex flex-col max-w-4xl mx-auto w-full pb-20">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Configuration
            </h1>
            <p className="text-base text-muted-foreground mt-2 leading-relaxed">
              Manage configuration and credentials for {activeApp.name}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border pb-px">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors duration-200 cursor-pointer ${
              activeTab === 'settings' 
                ? 'border-blue-500 text-blue-500' 
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-t-md'
            }`}
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" /> Settings
            </div>
          </button>
          <button
            onClick={() => setActiveTab('instructions')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors duration-200 cursor-pointer ${
              activeTab === 'instructions' 
                ? 'border-blue-500 text-blue-500' 
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-t-md'
            }`}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Instructions
            </div>
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {activeTab === 'settings' && (
          <>
            {/* General Settings Card */}
        <div className="p-8 sm:p-10 rounded-xl border border-border bg-card text-card-foreground shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="w-5 h-5 text-foreground" />
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              General Configuration
            </h2>
          </div>
          <p className="text-base text-muted-foreground mb-6">
            Update your application details and thresholds.
          </p>
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="space-y-4 max-w-xl">
              <div className="w-full">
                <label className="block text-base font-medium text-foreground mb-2">
                  Application Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-base h-11 px-4 py-3 bg-input border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                  placeholder="e.g. Production API"
                />
              </div>

              <div className="w-full">
                <label className="block text-base font-medium text-foreground mb-2">
                  Environment
                </label>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  className="w-full text-base h-11 px-4 py-3 bg-input border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow appearance-none"
                >
                  <option value="DEV">Development (DEV)</option>
                  <option value="STAGING">Staging (STAGING)</option>
                  <option value="PROD">Production (PROD)</option>
                </select>
              </div>

              <div className="w-full">
                <label className="block text-base font-medium text-foreground mb-2">
                  Slow Query Threshold (ms)
                </label>
                <input
                  type="number"
                  min="0"
                  value={slowQueryThresholdMs}
                  onChange={(e) =>
                    setSlowQueryThresholdMs(parseInt(e.target.value) || 0)
                  }
                  className="w-full text-base h-11 px-4 py-3 bg-input border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                />
                <p className="text-base text-muted-foreground mt-2 leading-relaxed">
                  Queries taking longer than this duration will be flagged as
                  slow.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-border mt-6">
              <button
                type="submit"
                disabled={isUpdating}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* SDK Key Management */}
        <div className="p-8 sm:p-10 rounded-xl border border-border bg-card text-card-foreground shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <KeyRound className="w-5 h-5 text-foreground" />
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              SDK Key Management
            </h2>
          </div>

          <div className="space-y-4">
            <p className="text-base text-muted-foreground leading-relaxed">
              This key is required to authenticate your backend agent with
              QueryAnalyzer. Keep it secret.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <code className="flex-1 bg-input/50 px-4 py-3 rounded-lg border border-border text-base font-mono text-foreground break-all sm:break-normal w-full">
                {activeApp.sdkKey}
              </code>
              <button
                onClick={copyToClipboard}
                className="p-2 border border-input bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg cursor-pointer transition-colors duration-200 flex items-center justify-center shrink-0 w-full sm:w-12 h-12"
                title="Copy SDK Key"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsRotateModalOpen(true)}
                className="bg-secondary border border-border hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors duration-200 flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                <KeyRound className="w-4 h-4" />
                Rotate SDK Key
              </button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="p-8 sm:p-10 rounded-xl border border-destructive/20 bg-destructive/5 text-card-foreground shadow-sm">
          <div className="flex items-center gap-2 mb-6 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="text-xl font-semibold tracking-tight">
              Danger Zone
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h3 className="font-semibold text-foreground">
                Delete Application
              </h3>
              <p className="text-base text-muted-foreground mt-2 leading-relaxed">
                Permanently delete {activeApp.name} and all of its associated
                query data. This action cannot be undone.
              </p>
            </div>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground border border-destructive/50 px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors duration-200 shrink-0 w-full sm:w-auto"
            >
              Delete App
            </button>
          </div>
        </div>
        </>
        )}

        {activeTab === 'instructions' && (
          <div className="p-8 sm:p-10 rounded-xl border border-border bg-card text-card-foreground shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <BookOpen className="w-5 h-5 text-foreground" />
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                Integration Instructions
              </h2>
            </div>
            
            <div className="space-y-6 text-base text-muted-foreground leading-relaxed">
              <p>
                To connect your Spring Boot application to QueryAnalyzer, follow these steps:
              </p>
              
              <div className="space-y-3">
                <h3 className="text-foreground font-medium">1. Add Dependency</h3>
                <p>Add the QueryAnalyzer Agent dependency to your <code>pom.xml</code>:</p>
                <div className="bg-black/50 border border-white/10 rounded-lg p-4 font-mono text-sm text-blue-300 overflow-x-auto">
{`<dependency>
  <groupId>com.queryanalyzer</groupId>
  <artifactId>queryanalyzer-agent</artifactId>
  <version>1.0.0</version>
</dependency>`}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-foreground font-medium">2. Configure Application Properties</h3>
                <p>Add the following configuration to your <code>application.yml</code>:</p>
                <div className="bg-black/50 border border-white/10 rounded-lg p-4 font-mono text-sm text-blue-300 overflow-x-auto">
{`queryanalyzer:
  agent:
    enabled: true
    backend-url: "http://localhost:8080/api/v1/ingest"
  app:
    sdk-key: "\${activeApp.sdkKey}"`}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-foreground font-medium">3. Start Your Application</h3>
                <p>Run your application. Once connected, the Active View badge will appear and queries will start showing up in the Dashboard.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rotate Key Modal */}
      {isRotateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-sm max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="shrink-0 bg-amber-500/10 p-3 rounded-full h-fit w-fit border border-amber-500/20 mx-auto sm:mx-0">
                  <AlertTriangle className="w-6 h-6 text-amber-500" />
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-xl font-semibold tracking-tight text-foreground">
                    Rotate SDK Key
                  </h3>
                  <p className="text-base text-muted-foreground mt-2 leading-relaxed">
                    Are you sure you want to rotate the SDK key? The current key
                    will immediately stop working, and your connected
                    applications will lose access until updated.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-6 bg-muted/30 border-t border-border flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                onClick={() => setIsRotateModalOpen(false)}
                disabled={isRotating}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border border-border sm:border-transparent rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleRotateKey}
                disabled={isRotating}
                className="w-full sm:w-auto bg-amber-500 text-amber-950 hover:bg-amber-400 px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isRotating && <Loader2 className="w-4 h-4 animate-spin" />}
                Continue Rotation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete App Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-destructive/30 rounded-xl shadow-sm max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="shrink-0 bg-destructive/10 p-3 rounded-full h-fit w-fit border border-destructive/20 mx-auto sm:mx-0">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-xl font-semibold tracking-tight text-foreground">
                    Delete Application
                  </h3>
                  <p className="text-base text-muted-foreground mt-2 leading-relaxed">
                    This action is irreversible. It will permanently delete the
                    application{" "}
                    <strong className="text-foreground">
                      {activeApp.name}
                    </strong>{" "}
                    and remove all associated data.
                  </p>

                  <div className="mt-6 text-left">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Please type{" "}
                      <span className="font-mono bg-muted px-1.5 py-0.5 rounded border border-border">
                        {activeApp.name}
                      </span>{" "}
                      to confirm.
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmName}
                      onChange={(e) => setDeleteConfirmName(e.target.value)}
                      className="w-full text-base h-11 px-4 py-3 bg-input border border-input rounded-lg text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive transition-shadow"
                      placeholder={activeApp.name}
                      autoFocus
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-6 bg-muted/30 border-t border-destructive/10 flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmName("");
                }}
                disabled={isDeleting}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border border-border sm:border-transparent rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting || deleteConfirmName !== activeApp.name}
                className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
