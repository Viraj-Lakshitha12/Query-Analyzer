if (typeof window !== "undefined") {
  (window as any).global = window;
}

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";
import { ThemeProvider } from "./components/ThemeProvider";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/DashboardHomePage";
import LiveMonitor from "./pages/LiveMonitorPage";
import QueryExplorer from "./pages/QueryExplorerPage";
import IssuesPage from "./pages/IssuesPage";
import SettingsPage from "./pages/SettingsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import { Toaster } from 'sonner';
import ErrorBoundary from './components/ErrorBoundary';
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000,
    },
  },
});

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center text-text">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider defaultTheme="system" storageKey="querylens-theme">
          <AuthProvider>
            <Toaster position="top-right" richColors />
            <ErrorBoundary>
              <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppProvider>
                      <Layout />
                    </AppProvider>
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="live" element={<LiveMonitor />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="queries" element={<QueryExplorer />} />
                <Route path="issues" element={<IssuesPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
              </Routes>
            </ErrorBoundary>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
