import axiosClient from './axiosClient';
import type { AppDTO } from '../types';

export interface UpdateAppRequest {
  name: string;
  environment: string;
  slowQueryThresholdMs: number;
}

export const updateApp = async (appId: string, data: UpdateAppRequest): Promise<AppDTO> => {
  const response = await axiosClient.put(`/apps/${appId}`, data);
  return response.data;
};

export const rotateAppKey = async (appId: string): Promise<AppDTO> => {
  const response = await axiosClient.post(`/apps/${appId}/rotate-key`);
  return response.data;
};

export const deleteApp = async (appId: string): Promise<void> => {
  await axiosClient.delete(`/apps/${appId}`);
};
