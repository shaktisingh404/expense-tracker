// src/api/data.ts
import client from './client';
import type { Transaction, Category } from '../types/data';

// Helper to get headers with DEBUG LOGGING
const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  
  const authHeader = `Bearer ${token}`;

  // 🔍 DEBUGGING LOGS (Check your browser console!)
  console.log("------- AUTH DEBUG -------");
  console.log("1. Token from Storage:", token);
  console.log("2. Sending Header:", authHeader);
  console.log("--------------------------");

  return { headers: { Authorization: authHeader } };
};

// --- TRANSACTIONS ---

export const getTransactions = async () => {
  // This will trigger the logs above
  return client.get<Transaction[]>('/transactions/', getAuthHeaders());
};

export const addTransaction = async (data: Omit<Transaction, 'id'>) => {
  return client.post<Transaction>('/transactions/', data, getAuthHeaders());
};

export const deleteTransaction = async (id: string) => {
  return client.delete(`/transactions/${id}/`, getAuthHeaders());
};

// --- CATEGORIES ---

export const getCategories = async () => {
  return client.get<Category[]>('/categories/', getAuthHeaders());
};

export const addCategory = async (name: string) => {
  return client.post<Category>('/categories/', { name }, getAuthHeaders());
};

export const deleteCategory = async (id: string) => {
  return client.delete(`/categories/${id}/`, getAuthHeaders());
};