import type { QueryLogDTO, QueryDetailDTO } from '../types';
import axiosClient from './axiosClient';

// Basic Page structure for Spring Data responses
export interface Page<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export const getQueries = async (appId: string, params?: Record<string, any>): Promise<Page<QueryLogDTO>> => {
  const response = await axiosClient.get(`/apps/${appId}/queries`, { params });
  return response.data;
};

export const getQueryDetails = async (appId: string, queryId: string): Promise<QueryDetailDTO> => {
  const response = await axiosClient.get(`/apps/${appId}/queries/${queryId}`);
  return response.data;
};

export const explainWithAi = async (appId: string, queryId: string, issueId: string): Promise<any> => {
  const response = await axiosClient.post(`/apps/${appId}/queries/${queryId}/issues/${issueId}/explain-ai`);
  return response.data;
};
