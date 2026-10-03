import axios from 'axios';
import {
  Hospital,
  FederatedStatus,
  FederatedRound,
  TrustScoreItem,
  SecureAggStatus,
  PredictionFeatures,
  PredictionResult,
  DashboardOverview,
  AuditLog,
  Experiment
} from '../types';

const API_BASE = '/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('fed_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Authentication
export const authApi = {
  login: async (credentials: any) => (await apiClient.post('/auth/login', credentials)).data,
  register: async (userData: any) => (await apiClient.post('/auth/register', userData)).data,
  getMe: async () => (await apiClient.get('/auth/me')).data,
};

// Hospitals
export const hospitalApi = {
  getAll: async (): Promise<Hospital[]> => (await apiClient.get('/hospitals')).data,
  getById: async (id: string) => (await apiClient.get(`/hospitals/${id}`)).data,
  create: async (data: any) => (await apiClient.post('/hospitals', data)).data,
  update: async (id: string, data: any) => (await apiClient.patch(`/hospitals/${id}`, data)).data,
  toggleStatus: async (id: string) => (await apiClient.post(`/hospitals/${id}/toggle-status`)).data,
};

// Federated Learning
export const federatedApi = {
  getStatus: async (): Promise<FederatedStatus> => (await apiClient.get('/federated/status')).data,
  start: async (params: any) => (await apiClient.post('/federated/start', params)).data,
  pause: async () => (await apiClient.post('/federated/pause')).data,
  resume: async () => (await apiClient.post('/federated/resume')).data,
  stop: async () => (await apiClient.post('/federated/stop')).data,
  getRounds: async (): Promise<FederatedRound[]> => (await apiClient.get('/federated/rounds')).data,
  getLogs: async () => (await apiClient.get('/federated/logs')).data,
};

// Trust Management
export const trustApi = {
  getScores: async (): Promise<TrustScoreItem[]> => (await apiClient.get('/trust/scores')).data,
  getHistory: async (hospitalId: string) => (await apiClient.get(`/trust/history/${hospitalId}`)).data,
};

// Secure Aggregation
export const aggregationApi = {
  getStatus: async (): Promise<SecureAggStatus> => (await apiClient.get('/aggregation/status')).data,
  runTest: async (params: any) => (await apiClient.post('/aggregation/test-run', params)).data,
};

// AI Predictions
export const predictionApi = {
  getSampleCases: async () => (await apiClient.get('/predictions/sample-cases')).data,
  predict: async (features: PredictionFeatures): Promise<PredictionResult> =>
    (await apiClient.post('/predictions/predict', features)).data,
};

// Analytics & Overview
export const analyticsApi = {
  getOverview: async (): Promise<DashboardOverview> => (await apiClient.get('/analytics/overview')).data,
  getCharts: async () => (await apiClient.get('/analytics/charts')).data,
};

// Experiments
export const experimentApi = {
  getAll: async (): Promise<Experiment[]> => (await apiClient.get('/experiments')).data,
  getScenarios: async () => (await apiClient.get('/experiments/scenarios')).data,
  create: async (params: any) => (await apiClient.post('/experiments', params)).data,
  getById: async (id: string) => (await apiClient.get(`/experiments/${id}`)).data,
};

// Audit Logs
export const auditApi = {
  getAll: async (params?: any): Promise<AuditLog[]> => (await apiClient.get('/audit-logs', { params })).data,
};

// Settings
export const settingsApi = {
  get: async () => (await apiClient.get('/settings')).data,
  update: async (data: any) => (await apiClient.post('/settings', data)).data,
};
