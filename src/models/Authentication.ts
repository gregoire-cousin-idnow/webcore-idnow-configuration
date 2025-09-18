/**
 * Authentication related types
 */

/**
 * User interface
 */
export interface User {
  userId: string;
  email: string;
  userType: 'admin' | 'user';
}

/**
 * Authentication state interface
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Login form data interface
 */
export interface LoginFormData {
  email: string;
  password: string;
}

/**
 * Register form data interface
 */
export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  userType: 'admin' | 'user';
  adminKey?: string;
}

/**
 * API response types
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

/**
 * API error interface
 */
export interface ApiError {
  message: string;
  error?: string;
}
