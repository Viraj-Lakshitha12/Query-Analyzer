import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAlertRules, useCreateAlertRule, useDeleteAlertRule } from '../hooks/useAlertRules';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
  Mail,
  Globe,
  Zap,
} from 'lucide-react';

const METRIC_OPTIONS = [
  { value: 'AVG_DURATION_MS', label: 'Average Duration', unit: 'ms' },
  { value: 'SLOW_QUERY_COUNT', label: 'Slow Query Count', unit: 'count' },
  { value: 'CRITICAL_ISSUE_COUNT', label: 'Critical Issue Count', unit: 'count' },
];

const CHANNEL_OPTIONS = [
  { value: 'EMAIL', label: 'Email', icon: Mail },
  { value: 'WEBHOOK', label: 'Webhook', icon: Globe },
];

function getMetricLabel(metric: string) {
  return METRIC_OPTIONS.find(m => m.value === metric)?.label || metric;
}

function getMetricUnit(metric: string) {
  return METRIC_OPTIONS.find(m => m.value === metric)?.unit || '';
}

export default function AlertsPage() {
  const { activeApp } = useApp();
  const navigate = useNavigate();
  const { data: rules, isLoading } = useAlertRules(activeApp?.id || null);
  const { mutate: createRule, isPending: isCreating } = useCreateAlertRule();
  const { mutate: deleteRule, isPending: isDeleting } = useDeleteAlertRule();

  // Dialog state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Form state
  const [formMetric, setFormMetric] = useState('AVG_DURATION_MS');
  const [formThreshold, setFormThreshold] = useState(500);
  const [formChannel, setFormChannel] = useState('EMAIL');
  const [formEmail, setFormEmail] = useState('');
  const [formWebhook, setFormWebhook] = useState('');

  const resetForm = () => {
    setFormMetric('AVG_DURATION_MS');
    setFormThreshold(500);
    setFormChannel('EMAIL');
    setFormEmail('');
    setFormWebhook('');
  };

  const handleCreate = () => {
    if (!activeApp) return;
    createRule(
      {
        appId: activeApp.id,
        data: {
          metricName: formMetric,
          thresholdValue: formThreshold,
          channel: formChannel,
          emailAddress: formChannel === 'EMAIL' ? formEmail : undefined,
          webhookUrl: formChannel === 'WEBHOOK' ? formWebhook : undefined,
          active: true,
        },
      },
      {
        onSuccess: () => {
          setIsAddOpen(false);
          resetForm();
        },
      }
    );
  };

  const handleDelete = (ruleId: string) => {
    if (!activeApp) return;
    deleteRule(
      { appId: activeApp.id, ruleId },
      { onSuccess: () => setDeleteTarget(null) }
    );
  };

  // No app selected state
  if (!activeApp) {
    return (
      <div className="p-6 sm:p-8 md:p-10 h-full flex flex-col items-center justify-center">
        <div className="bg-card border border-border rounded-2xl p-10 text-center max-w-md shadow-sm">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Bell className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground mb-3">
            No Application Selected
          </h2>
          <p className="text-base text-muted-foreground mb-8 leading-relaxed">
            Please select an application from the sidebar to manage alert rules.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-xl text-base font-medium transition-colors shadow-sm cursor-pointer"
          >
            Go to Applications
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 md:p-10 max-w-4xl mx-auto w-full pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 sm:text-3xl">
            <Bell className="w-6 h-6 text-blue-500" />
            Alert Rules
          </h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Configure automated alerts for {activeApp.name}
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Rule
        </button>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-card border border-border rounded-xl p-16 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Loading alert rules…</span>
          </div>
        ) : !rules?.length ? (
          /* Empty state */
          <div className="bg-card border border-border rounded-xl p-16 text-center">
            <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
              <Zap className="w-10 h-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No Alert Rules Yet
            </h3>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
              Set up automated alerts to get notified when key performance metrics exceed your thresholds.
            </p>
            <button
              onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-medium transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Your First Alert Rule
            </button>
          </div>
        ) : (
          rules.map((rule) => {
            const ChannelIcon = rule.channel === 'EMAIL' ? Mail : Globe;
            return (
              <div
                key={rule.id}
                className="bg-card border border-border rounded-xl p-6 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm hover:shadow-md transition-shadow duration-200 group"
              >
                {/* Icon */}
                <div className="shrink-0 w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20">
                  <ChannelIcon className="w-5 h-5 text-blue-500" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-foreground">
                      {getMetricLabel(rule.metricName)}
                    </span>
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border font-mono">
                      ≥ {rule.thresholdValue}{getMetricUnit(rule.metricName) === 'ms' ? 'ms' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                      rule.channel === 'EMAIL'
                        ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    }`}>
                      <ChannelIcon className="w-3 h-3" />
                      {rule.channel}
                    </span>
                    {rule.channel === 'EMAIL' && rule.emailAddress && (
                      <span className="truncate max-w-[200px]">{rule.emailAddress}</span>
                    )}
                    {rule.channel === 'WEBHOOK' && rule.webhookUrl && (
                      <span className="truncate max-w-[200px] font-mono">{rule.webhookUrl}</span>
                    )}
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={() => setDeleteTarget(rule.id)}
                  className="shrink-0 p-2 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer opacity-60 group-hover:opacity-100"
                  title="Delete rule"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* ── Add Rule Dialog ── */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-lg max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/10 rounded-full text-blue-500 border border-blue-500/20">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-foreground">
                  New Alert Rule
                </h3>
              </div>

              <div className="space-y-5">
                {/* Metric */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Metric
                  </label>
                  <select
                    value={formMetric}
                    onChange={(e) => setFormMetric(e.target.value)}
                    className="w-full text-sm h-10 px-3 py-2 bg-input border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow appearance-none"
                  >
                    {METRIC_OPTIONS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Threshold */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Threshold
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      value={formThreshold}
                      onChange={(e) => setFormThreshold(parseInt(e.target.value) || 0)}
                      className="w-full text-sm h-10 px-3 py-2 bg-input border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow pr-16"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                      {getMetricUnit(formMetric)}
                    </span>
                  </div>
                </div>

                {/* Channel */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Notification Channel
                  </label>
                  <div className="flex gap-2">
                    {CHANNEL_OPTIONS.map((ch) => (
                      <button
                        key={ch.value}
                        type="button"
                        onClick={() => setFormChannel(ch.value)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border ${
                          formChannel === ch.value
                            ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                            : 'bg-muted text-muted-foreground border-border hover:bg-muted/80 hover:text-foreground'
                        }`}
                      >
                        <ch.icon className="w-4 h-4" />
                        {ch.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Conditional: Email or Webhook URL */}
                {formChannel === 'EMAIL' && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="alerts@example.com"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full text-sm h-10 px-3 py-2 bg-input border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                    />
                  </div>
                )}
                {formChannel === 'WEBHOOK' && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Webhook URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://hooks.slack.com/services/..."
                      value={formWebhook}
                      onChange={(e) => setFormWebhook(e.target.value)}
                      className="w-full text-sm h-10 px-3 py-2 bg-input border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow font-mono"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-6 bg-muted/30 border-t border-border flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                onClick={() => {
                  setIsAddOpen(false);
                  resetForm();
                }}
                disabled={isCreating}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border border-border sm:border-transparent rounded-md cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={isCreating || formThreshold <= 0}
                className="w-full sm:w-auto bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Rule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Dialog ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-destructive/30 rounded-xl shadow-lg max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-rose-500/10 rounded-full text-rose-500 border border-rose-500/20">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Delete Alert Rule
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Are you sure you want to delete this alert rule? This action cannot be undone.
              </p>
            </div>
            <div className="p-4 sm:p-6 bg-muted/30 border-t border-destructive/10 flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border border-border sm:border-transparent rounded-md cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteTarget)}
                disabled={isDeleting}
                className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
