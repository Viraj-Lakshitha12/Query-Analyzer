import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueries, getQueryDetails, explainWithAi } from '../api/queries';

export const useQueries = (appId: string | null, params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['queries', appId, params],
    queryFn: () => getQueries(appId!, params),
    enabled: !!appId,
    // Keep previous data while fetching a new page to prevent UI jitter
    placeholderData: (previousData) => previousData,
  });
};

export const useQueryDetails = (appId: string | null, queryId: string | null) => {
  return useQuery({
    queryKey: ['queryDetails', appId, queryId],
    queryFn: () => getQueryDetails(appId!, queryId!),
    enabled: !!appId && !!queryId,
  });
};

export const useExplainAi = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ appId, queryId, issueId }: { appId: string, queryId: string, issueId: string }) => 
      explainWithAi(appId, queryId, issueId),
    onSuccess: (_, { appId, queryId }) => {
      // Invalidate to fetch the new AI suggestion
      queryClient.invalidateQueries({ queryKey: ['queryDetails', appId, queryId] });
    }
  });
};
