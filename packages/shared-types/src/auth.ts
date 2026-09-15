import type { User, UserRole } from './user';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser extends User {
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}
