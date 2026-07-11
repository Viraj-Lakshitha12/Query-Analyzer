import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAlertRules, createAlertRule, deleteAlertRule } from '../api/alerts';
import type { CreateAlertRuleRequest } from '../api/alerts';
import { toast } from 'sonner';

export const useAlertRules = (appId: string | null) => {
  return useQuery({
    queryKey: ['alertRules', appId],
    queryFn: () => getAlertRules(appId!),
    enabled: !!appId,
    placeholderData: (prev) => prev,
  });
};

export const useCreateAlertRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ appId, data }: { appId: string; data: CreateAlertRuleRequest }) =>
      createAlertRule(appId, data),
    onSuccess: (_, { appId }) => {
      queryClient.invalidateQueries({ queryKey: ['alertRules', appId] });
      toast.success('Alert rule created successfully');
    },
    onError: () => {
      toast.error('Failed to create alert rule');
    },
  });
};

export const useDeleteAlertRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ appId, ruleId }: { appId: string; ruleId: string }) =>
      deleteAlertRule(appId, ruleId),
    onSuccess: (_, { appId }) => {
      queryClient.invalidateQueries({ queryKey: ['alertRules', appId] });
      toast.success('Alert rule deleted');
    },
    onError: () => {
      toast.error('Failed to delete alert rule');
    },
  });
};
