import { Outlet, Navigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { useTheme } from "./ThemeProvider";
import {
  Activity,
  Database,
  AlertTriangle,
  Settings,
  LogOut,
  Code2,
  Sun,
  Moon,
  Laptop,
  Menu,
  ChevronRight,
  Server,
  PieChart,
  X,
} from "lucide-react";
import { useState } from "react";

export default function Layout() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const { apps, activeApp, setActiveApp, isLoading: appLoading } = useApp();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  if (authLoading || appLoading)
    return (
      <div className="min-h-screen flex items-center justify-center text-foreground">
        Loading...
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;

  const navigation = [
    { name: "Apps", href: "/", icon: Server },
    { name: "Analytics", href: "/analytics", icon: PieChart },
    { name: "Live Monitor", href: "/live", icon: Activity },
    { name: "Queries", href: "/queries", icon: Database },
    { name: "Issues", href: "/issues", icon: AlertTriangle },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-border flex-shrink-0">
        <Code2 className="w-6 h-6 text-blue-500 flex-shrink-0" />
        <span className="font-bold text-lg tracking-tight ml-2 truncate">
          QueryLens
        </span>
      </div>

      {/* App Selector */}
      <div className="p-4 border-b border-border flex-shrink-0">
        <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wider">
          Environment
        </label>
        <select
          className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          value={activeApp?.id || ""}
          onChange={(e) => {
            const selected = apps.find((a) => a.id === e.target.value);
            if (selected) setActiveApp(selected);
          }}
        >
          {apps.map((app) => (
            <option key={app.id} value={app.id}>
              {app.name} ({app.environment})
            </option>
          ))}
          {apps.length === 0 && <option disabled>No apps found</option>}
        </select>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 flex flex-col gap-1 px-3 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setIsMobileSidebarOpen(false)}
              className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium cursor-pointer transition-all duration-200 group relative ${
                isActive
                  ? "bg-blue-500/10 text-blue-500"
                  : "text-muted-foreground hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:text-foreground"
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-500 rounded-r-full" />
              )}
              <item.icon
                className={`w-5 h-5 flex-shrink-0 mr-3 ${isActive ? "text-blue-500" : "text-muted-foreground group-hover:text-foreground/80"}`}
              />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-border flex items-center justify-between flex-shrink-0">
        <div className="flex items-center min-w-0 cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white shadow-inner flex-shrink-0 group-hover:shadow-md transition-all duration-200">
            {user.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="ml-3 min-w-0">
            <p className="text-sm font-medium text-foreground truncate group-hover:text-blue-500 transition-colors duration-200">
              {user.fullName}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowLogoutModal(true)}
          className="text-muted-foreground hover:text-rose-500 transition-colors duration-200 p-1.5 rounded-md hover:bg-rose-500/10 flex-shrink-0 ml-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden selection:bg-blue-500/30">
      {/* ── Mobile Sidebar Overlay ── */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* ── Mobile Sidebar (drawer) ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-background flex flex-col transition-transform duration-300 ease-in-out md:hidden ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close button for mobile */}
        <button
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1"
          onClick={() => setIsMobileSidebarOpen(false)}
        >
          <X className="w-5 h-5" />
        </button>
        <SidebarContent />
      </aside>

      {/* ── Desktop Sidebar (fixed) ── */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-background flex-col">
        <SidebarContent />
      </aside>

      {/* ── Main Content Area (offset by sidebar width on md+) ── */}
      <div className="flex-1 w-full md:w-[calc(100%-16rem)] md:ml-64 min-h-screen overflow-x-hidden overflow-y-auto bg-background/50 flex flex-col">
        {/* TopBar */}
        <header className="sticky top-0 z-20 h-16 flex items-center justify-between px-4 sm:px-6 border-b border-border bg-background/90 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center">
            {/* Hamburger - mobile only */}
            <button
              className="md:hidden p-2 -ml-2 mr-2 text-muted-foreground hover:text-foreground rounded-md"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center text-sm text-muted-foreground">
              <span>{activeApp?.name || "Workspace"}</span>
              <ChevronRight className="w-4 h-4 mx-1" />
              <span className="font-medium text-foreground">
                {navigation.find((n) => n.href === location.pathname)?.name ||
                  "Page"}
              </span>
            </div>
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-card border border-border rounded-full p-1 shadow-sm">
              <button
                onClick={() => setTheme("light")}
                className={`p-1.5 rounded-full transition-colors ${theme === "light" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                title="Light Mode"
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`p-1.5 rounded-full transition-colors ${theme === "dark" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                title="Dark Mode"
              >
                <Moon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTheme("system")}
                className={`p-1.5 rounded-full transition-colors ${theme === "system" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                title="System Theme"
              >
                <Laptop className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content — only this scrolls */}
        <main className="flex-1 overflow-y-auto bg-background">
          <Outlet />
        </main>
      </div>

      {/* ── Logout Confirmation Modal ── */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-rose-500/10 rounded-full text-rose-500">
                  <LogOut className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Sign Out
                </h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Are you sure you want to log out of QueryLens? You will need to
                sign in again to access your environments.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="px-4 py-2 text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowLogoutModal(false);
                    logout();
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-rose-500 hover:bg-rose-600 rounded-md transition-colors shadow-sm"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
