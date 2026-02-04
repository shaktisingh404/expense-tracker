// src/api/auth.ts
import client from './client';
import type { LoginCredentials, AuthResponse, UserProfile } from '../types/auth';

// We tell axios: "We are sending LoginCredentials, and we expect an AuthResponse back"
export const loginUser = async (data: LoginCredentials) => {
  return client.post<AuthResponse>('/users/login/', data);
};

export const registerUser = async (data: any) => {
  // You can define a RegisterCredentials interface later
  return client.post('/users/register/', data);
};

export const getUserProfile = async (token: string) => {
  return client.get<UserProfile>('/users/', {
    headers: { Authorization: `Bearer ${token}` },
  });
};