import { useQuery } from '@tanstack/react-query';
import { getAnalytics, getSlowQueries, getN1Patterns } from '../api/analytics';

export const useAnalytics = (appId: string | null, from: string, to: string) => {
  return useQuery({
    queryKey: ['analytics', appId, from, to],
    queryFn: () => getAnalytics(appId!, from, to),
    enabled: !!appId,
  });
};

export const useSlowQueries = (appId: string | null) => {
  return useQuery({
    queryKey: ['slowQueries', appId],
    queryFn: () => getSlowQueries(appId!),
    enabled: !!appId,
  });
};

export const useN1Patterns = (appId: string | null) => {
  return useQuery({
    queryKey: ['n1Patterns', appId],
    queryFn: () => getN1Patterns(appId!),
    enabled: !!appId,
  });
};
