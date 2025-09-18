// User related types
export interface User {
  userId: string;
  email: string;
  userType: 'admin' | 'user';
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

// Shortname related types
export interface Shortname {
  shortname: string;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShortnameResponse {
  shortnames: Shortname[];
}

// Version related types
export interface Version {
  versionId: string;
  shortname: string;
  version: string;
  description: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface VersionResponse {
  versions: Version[];
}

// Configuration related types
export interface Configuration {
  configId: string;
  shortnameVersion: string;
  shortname: string;
  version: string;
  key: string;
  value: any;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConfigurationResponse {
  configurations: Configuration[];
}

// API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  error?: string;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  userType: 'admin' | 'user';
  adminKey?: string;
}

export interface ShortnameFormData {
  shortname: string;
  description: string;
}

export interface VersionFormData {
  version: string;
  description: string;
  isActive: boolean;
}

export interface ConfigurationFormData {
  key: string;
  value: any;
  description: string;
}
