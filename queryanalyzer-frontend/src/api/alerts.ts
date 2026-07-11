import axiosClient from './axiosClient';

export interface AlertRuleDTO {
  id: string;
  metricName: string;
  thresholdValue: number;
  channel: string;
  webhookUrl?: string;
  emailAddress?: string;
  active: boolean;
}

export interface CreateAlertRuleRequest {
  metricName: string;
  thresholdValue: number;
  channel: string;
  webhookUrl?: string;
  emailAddress?: string;
  active: boolean;
}

export const getAlertRules = async (appId: string): Promise<AlertRuleDTO[]> => {
  const response = await axiosClient.get(`/apps/${appId}/alerts`);
  return response.data;
};

export const createAlertRule = async (appId: string, data: CreateAlertRuleRequest): Promise<AlertRuleDTO> => {
  const response = await axiosClient.post(`/apps/${appId}/alerts`, data);
  return response.data;
};

export const deleteAlertRule = async (appId: string, ruleId: string): Promise<void> => {
  await axiosClient.delete(`/apps/${appId}/alerts/${ruleId}`);
};
