import axiosClient from './axiosClient';
import type { QueryIssueDTO } from '../types';

export const getIssues = async (appId: string, params?: Record<string, any>): Promise<QueryIssueDTO[]> => {
  const response = await axiosClient.get(`/apps/${appId}/issues`, { params });
  return response.data;
};

export const resolveIssue = async (appId: string, issueId: string): Promise<QueryIssueDTO> => {
  const response = await axiosClient.put(`/apps/${appId}/issues/${issueId}/resolve`);
  return response.data;
};
