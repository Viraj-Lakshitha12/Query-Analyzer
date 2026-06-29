import axiosClient from './axiosClient';
import type { AnalyticsDTO, QueryLogDTO, N1PatternDTO } from '../types';

export const getAnalytics = async (appId: string, from: string, to: string): Promise<AnalyticsDTO> => {
  const response = await axiosClient.get(`/apps/${appId}/analytics?from=${from}&to=${to}`);
  return response.data;
};

export const getSlowQueries = async (appId: string): Promise<QueryLogDTO[]> => {
  const response = await axiosClient.get(`/apps/${appId}/queries/slow`);
  return response.data;
};

export const getN1Patterns = async (appId: string): Promise<N1PatternDTO[]> => {
  const response = await axiosClient.get(`/apps/${appId}/issues/n1-patterns`);
  return response.data;
};
