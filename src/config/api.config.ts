/**
 * API Configuration
 */

/**
 * Base URL for API requests
 */
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://6bz00r29y3.execute-api.eu-west-3.amazonaws.com/api';

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {

  AUTH: {
    LOGIN: `${API_BASE_URL}/login`,
    REGISTER: `${API_BASE_URL}/register`,
  },
  
  SHORTNAMES: {
    BASE: `${API_BASE_URL}/shortnames`,
    DETAIL: (shortname: string) => `${API_BASE_URL}/shortnames/${shortname}`,
  },
  
  VERSIONS: {
    // Version-first approach endpoints
    ALL: `${API_BASE_URL}/versions`,
    CREATE: `${API_BASE_URL}/versions`,
    DETAIL_BY_ID: (version: string) => `${API_BASE_URL}/versions/${version}`,
    SHORTNAMES: (version: string) => `${API_BASE_URL}/versions/${version}/shortnames`,
    
    // Legacy shortname-first approach endpoints (kept for backward compatibility)
    BY_SHORTNAME: (shortname: string) => `${API_BASE_URL}/shortnames/${shortname}/versions`,
    DETAIL: (shortname: string, version: string) => `${API_BASE_URL}/shortnames/${shortname}/versions/${version}`,
  },
  
  CONFIGURATIONS: {
    BY_VERSION: (shortname: string, version: string) => `${API_BASE_URL}/shortnames/${shortname}/versions/${version}/configurations`,
    DETAIL: (shortname: string, version: string, configId: string) => `${API_BASE_URL}/shortnames/${shortname}/versions/${version}/configurations/${configId}`,
  },
};

/**
 * Default request headers
 */
export const getDefaultHeaders = (): HeadersInit => ({
  'Content-Type': 'application/json',
});

/**
 * Get authentication headers
 */
export const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    ...getDefaultHeaders() as Record<string, string>
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

/**
 * API response status codes
 */
export const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

/**
 * API request timeout in milliseconds
 */
export const REQUEST_TIMEOUT = 30000; // 30 seconds
