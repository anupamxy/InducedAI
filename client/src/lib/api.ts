import { apiRequest } from "./queryClient";
import { App, User } from "@shared/schema";

// Auth API
export const register = async (username: string, password: string) => {
  const res = await apiRequest("POST", "/api/auth/register", { username, password });
  return res.json();
};

export const login = async (username: string, password: string) => {
  const res = await apiRequest("POST", "/api/auth/login", { username, password });
  return res.json();
};

export const logout = async () => {
  const res = await apiRequest("POST", "/api/auth/logout");
  return res.json();
};

export const getMe = async () => {
  const res = await apiRequest("GET", "/api/auth/me");
  return res.json();
};

export const regenerateApiKey = async () => {
  const res = await apiRequest("POST", "/api/auth/regenerate-key");
  return res.json();
};

// App API
export const registerApp = async (app: {
  name: string;
  baseUrl: string;
  strategy: string;
  requestCount: number;
  timeWindow: number;
  authToken?: string;
}) => {
  const res = await apiRequest("POST", "/api/apps", app);
  return res.json();
};

export const getApps = async (): Promise<App[]> => {
  const res = await apiRequest("GET", "/api/apps");
  return res.json();
};

export const updateApp = async (id: number, app: Partial<App>) => {
  const res = await apiRequest("PUT", `/api/apps/${id}`, app);
  return res.json();
};

// Queued Requests API
export interface QueuedRequestWithTimes extends QueuedRequest {
  estimatedWaitTime: number;
  timeInQueue: number;
}

export const getQueuedRequests = async (): Promise<QueuedRequestWithTimes[]> => {
  const res = await apiRequest("GET", "/api/queued-requests");
  return res.json();
};

export const cancelQueuedRequest = async (id: number) => {
  const res = await apiRequest("DELETE", `/api/queued-requests/${id}`);
  return res.json();
};

// Stats API
export interface Stats {
  totalApps: number;
  totalRequestsToday: number;
  rateLimitedRequests: number;
  queuedRequests: number;
  dailyStats: Record<string, number>;
}

export const getStats = async (): Promise<Stats> => {
  const res = await apiRequest("GET", "/api/stats");
  return res.json();
};

// Types
interface QueuedRequest {
  id: number;
  userId: number;
  appId: string;
  path: string;
  method: string;
  queuedAt: string;
  estimatedProcessingTime: string;
  status: string;
}
