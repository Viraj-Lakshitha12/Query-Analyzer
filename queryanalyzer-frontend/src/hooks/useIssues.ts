import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getIssues, resolveIssue } from '../api/issues';

export const useIssues = (appId: string | null, params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['issues', appId, params],
    queryFn: () => getIssues(appId!, params),
    enabled: !!appId,
    placeholderData: (previousData) => previousData,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });
};

export const useResolveIssue = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ appId, issueId }: { appId: string, issueId: string }) => resolveIssue(appId, issueId),
    onSuccess: (_, { appId }) => {
      // Invalidate issues query to refetch
      queryClient.invalidateQueries({ queryKey: ['issues', appId] });
    }
  });
};
