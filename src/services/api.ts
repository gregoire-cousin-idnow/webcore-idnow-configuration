import { 
  ApiResponse, 
  ApiError, 
  User, 
  Shortname, 
  ShortnameResponse, 
  Version, 
  VersionResponse, 
  Configuration, 
  ConfigurationResponse,
  LoginFormData,
  RegisterFormData,
  ShortnameFormData,
  VersionFormData,
  ConfigurationFormData
} from '../types';

// Replace the hardcoded API base URL with the generated API Gateway endpoint.
// After deploying the Terraform configuration, the API Gateway endpoint will be displayed in the Terraform output.
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://wsom6tfto9.execute-api.eu-west-3.amazonaws.com/api';

// Common function to handle API responses
async function handleApiResponse<T>(response: Response, setError?: (error: string) => void): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    const errorMessage = errorText || 'An unexpected error occurred.';
    if (setError) setError(errorMessage);
    
    // Handle token expiration
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    throw new Error(errorMessage);
  }
  return response.json() as Promise<T>;
}

// Helper function to get auth headers
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

// Authentication API
export const authApi = {
  login: async (data: LoginFormData, setError?: (error: string) => void): Promise<ApiResponse<{ token: string; user: User }>> => {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleApiResponse<ApiResponse<{ token: string; user: User }>>(response, setError);
  },

  register: async (data: RegisterFormData, setError?: (error: string) => void): Promise<ApiResponse<{ token: string; user: User }>> => {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleApiResponse<ApiResponse<{ token: string; user: User }>>(response, setError);
  },
};

// Shortnames API
export const shortnamesApi = {
  getAll: async (setError?: (error: string) => void): Promise<ShortnameResponse> => {
    const response = await fetch(`${API_BASE_URL}/shortnames`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleApiResponse<ShortnameResponse>(response, setError);
  },

  getOne: async (shortname: string, setError?: (error: string) => void): Promise<Shortname> => {
    const response = await fetch(`${API_BASE_URL}/shortnames/${shortname}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleApiResponse<Shortname>(response, setError);
  },

  create: async (data: ShortnameFormData, setError?: (error: string) => void): Promise<Shortname> => {
    const response = await fetch(`${API_BASE_URL}/shortnames`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleApiResponse<Shortname>(response, setError);
  },

  update: async (shortname: string, data: ShortnameFormData, setError?: (error: string) => void): Promise<Shortname> => {
    const response = await fetch(`${API_BASE_URL}/shortnames/${shortname}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleApiResponse<Shortname>(response, setError);
  },

  delete: async (shortname: string, setError?: (error: string) => void): Promise<ApiResponse<void>> => {
    const response = await fetch(`${API_BASE_URL}/shortnames/${shortname}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleApiResponse<ApiResponse<void>>(response, setError);
  },
};

// Versions API
export const versionsApi = {
  getAll: async (shortname: string, setError?: (error: string) => void): Promise<VersionResponse> => {
    const response = await fetch(`${API_BASE_URL}/shortnames/${shortname}/versions`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleApiResponse<VersionResponse>(response, setError);
  },

  getOne: async (shortname: string, version: string, setError?: (error: string) => void): Promise<Version> => {
    const response = await fetch(`${API_BASE_URL}/shortnames/${shortname}/versions/${version}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleApiResponse<Version>(response, setError);
  },

  create: async (shortname: string, data: VersionFormData, setError?: (error: string) => void): Promise<Version> => {
    const response = await fetch(`${API_BASE_URL}/shortnames/${shortname}/versions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleApiResponse<Version>(response, setError);
  },

  update: async (shortname: string, version: string, data: VersionFormData, setError?: (error: string) => void): Promise<Version> => {
    const response = await fetch(`${API_BASE_URL}/shortnames/${shortname}/versions/${version}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleApiResponse<Version>(response, setError);
  },

  delete: async (shortname: string, version: string, setError?: (error: string) => void): Promise<ApiResponse<void>> => {
    const response = await fetch(`${API_BASE_URL}/shortnames/${shortname}/versions/${version}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleApiResponse<ApiResponse<void>>(response, setError);
  },
};

// Configurations API
export const configurationsApi = {
  getAll: async (shortname: string, version: string, setError?: (error: string) => void): Promise<ConfigurationResponse> => {
    const response = await fetch(`${API_BASE_URL}/shortnames/${shortname}/versions/${version}/configurations`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleApiResponse<ConfigurationResponse>(response, setError);
  },

  getOne: async (shortname: string, version: string, configId: string, setError?: (error: string) => void): Promise<Configuration> => {
    const response = await fetch(`${API_BASE_URL}/shortnames/${shortname}/versions/${version}/configurations/${configId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleApiResponse<Configuration>(response, setError);
  },

  create: async (shortname: string, version: string, data: ConfigurationFormData, setError?: (error: string) => void): Promise<Configuration> => {
    const response = await fetch(`${API_BASE_URL}/shortnames/${shortname}/versions/${version}/configurations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleApiResponse<Configuration>(response, setError);
  },

  update: async (shortname: string, version: string, configId: string, data: ConfigurationFormData, setError?: (error: string) => void): Promise<Configuration> => {
    const response = await fetch(`${API_BASE_URL}/shortnames/${shortname}/versions/${version}/configurations/${configId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleApiResponse<Configuration>(response, setError);
  },

  delete: async (shortname: string, version: string, configId: string, setError?: (error: string) => void): Promise<ApiResponse<void>> => {
    const response = await fetch(`${API_BASE_URL}/shortnames/${shortname}/versions/${version}/configurations/${configId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleApiResponse<ApiResponse<void>>(response, setError);
  },
};

export default {
  auth: authApi,
  shortnames: shortnamesApi,
  versions: versionsApi,
  configurations: configurationsApi,
};
