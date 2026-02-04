// src/types/auth.ts

// What we send to Django to log in
export interface LoginCredentials {
  username: string;
  password: string;
}

// What Django sends back (access & refresh tokens)
export interface AuthResponse {
  access: string;
  refresh: string;
}

// What a User looks like (based on your Django model)
export interface UserProfile {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
}