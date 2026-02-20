import axios, { AxiosInstance, AxiosError } from 'axios';
import { getAuthToken, setAuthToken, removeAuthToken } from './auth-storage';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Handle token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const response = await axios.post(
              `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
              {},
              { withCredentials: true }
            );

            const { accessToken } = response.data.data;
            setAuthToken(accessToken);

            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            removeAuthToken();
            window.location.href = '/auth/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth
  async register(data: {
    email: string;
    username: string;
    password: string;
    displayName: string;
  }) {
    const response = await this.client.post('/api/auth/register', data);
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/api/auth/login', { email, password });
    return response.data;
  }

  async logout() {
    const response = await this.client.post('/api/auth/logout');
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.client.get('/api/auth/me');
    return response.data;
  }

  // Groups
  async getGroups(params?: { filter?: string }) {
    const response = await this.client.get('/api/groups', { params });
    return response.data;
  }

  async getGroup(id: string) {
    const response = await this.client.get(`/api/groups/${id}`);
    return response.data;
  }

  async createGroup(data: any) {
    const response = await this.client.post('/api/groups', data);
    return response.data;
  }

  async updateGroup(id: string, data: any) {
    const response = await this.client.patch(`/api/groups/${id}`, data);
    return response.data;
  }

  async joinGroup(id: string) {
    const response = await this.client.post(`/api/groups/${id}/join`);
    return response.data;
  }

  async joinGroupByHandle(handle: string) {
    const response = await this.client.post('/api/groups/join-handle', { handle });
    return response.data;
  }

  // Rankings
  async getLeaderboard(groupId: string, page = 1, limit = 50) {
    const response = await this.client.get(`/api/rankings/group/${groupId}`, {
      params: { page, limit },
    });
    return response.data;
  }

  async getUserRanking(userId: string, groupId: string) {
    const response = await this.client.get(
      `/api/rankings/user/${userId}/group/${groupId}`
    );
    return response.data;
  }

  // Matches
  async getMatches(params?: any) {
    const response = await this.client.get('/api/matches', { params });
    return response.data;
  }

  async getMatch(id: string) {
    const response = await this.client.get(`/api/matches/${id}`);
    return response.data;
  }

  async createMatch(data: any) {
    const response = await this.client.post('/api/matches', data);
    return response.data;
  }

  // Notifications
  async getNotifications(params?: any) {
    const response = await this.client.get('/api/notifications', { params });
    return response.data;
  }

  async markNotificationAsRead(id: string) {
    const response = await this.client.patch(`/api/notifications/${id}/read`);
    return response.data;
  }

  async markAllNotificationsAsRead() {
    const response = await this.client.post('/api/notifications/mark-all-read');
    return response.data;
  }
}

export const apiClient = new ApiClient();
