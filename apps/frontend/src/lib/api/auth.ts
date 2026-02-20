import { apiClient } from '@/lib/api/api-client';

export interface UserStats {
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
}

export interface User {
  _id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  role: 'user' | 'admin' | 'moderator';
  isVerified: boolean;
  isActive: boolean;
  stats: UserStats;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const data = await apiClient.login(email, password);
  return data.data; // The backend wrapper ApiResponse returns { success, data }
};

export const register = async (userData: any): Promise<AuthResponse> => {
  const data = await apiClient.register(userData);
  return data.data;
};

export const logout = async (): Promise<void> => {
  await apiClient.logout();
};

export const getMe = async (): Promise<User> => {
  const data = await apiClient.getCurrentUser();
  return data.data.user;
};
