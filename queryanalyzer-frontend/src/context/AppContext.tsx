import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import api from '../api/axiosClient';
import type { AppDTO } from '../types';
import { useAuth } from './AuthContext';

interface AppContextType {
  apps: AppDTO[];
  activeApp: AppDTO | null;
  setActiveApp: (app: AppDTO) => void;
  refreshApps: () => Promise<void>;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [apps, setApps] = useState<AppDTO[]>([]);
  const [activeApp, setActiveApp] = useState<AppDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshApps = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await api.get('/apps');
      setApps(res.data);
      // Update activeApp if it exists and is in the refreshed list
      if (activeApp && res.data.length > 0) {
        const updatedActiveApp = res.data.find((app: AppDTO) => app.id === activeApp.id);
        if (updatedActiveApp) {
          setActiveApp(updatedActiveApp);
        }
      } else if (res.data.length > 0 && !activeApp) {
        setActiveApp(res.data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshApps();
  }, [user]);

  return (
    <AppContext.Provider value={{ apps, activeApp, setActiveApp, refreshApps, isLoading }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
