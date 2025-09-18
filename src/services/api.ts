import { 
  ApiResponse, 
  ApiError, 
  User, 
  LoginFormData,
  RegisterFormData
} from '../models/Authentication';

import {
  Shortname,
  ShortnameResponse,
  ShortnameFormData
} from '../models/Shortname';

import {
  Version,
  VersionResponse,
  VersionFormData
} from '../models/Version';

import {
  Configuration,
  ConfigurationResponse,
  ConfigurationFormData
} from '../models/Configuration';

import { API_BASE_URL, getAuthHeaders } from '../config/api.config';

async function handleApiResponse<T>(response: Response, setError?: (error: string) => void): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    const errorMessage = errorText || 'An unexpected error occurred.';
    if (setError) setError(errorMessage);
    
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    throw new Error(errorMessage);
  }
  return response.json() as Promise<T>;
}

export const authApi = {
  login: async (data: LoginFormData, setError?: (error: string) => void): Promise<{ message: string; token: string; user: User }> => {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleApiResponse<{ message: string; token: string; user: User }>(response, setError);
  },

  register: async (data: RegisterFormData, setError?: (error: string) => void): Promise<{ message: string; token: string; user: User }> => {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleApiResponse<{ message: string; token: string; user: User }>(response, setError);
  },
};

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

export const versionsApi = {
  
  getAllVersions: async (setError?: (error: string) => void): Promise<VersionResponse> => {
    
    try {
      const response = await fetch(`${API_BASE_URL}/shortnames`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      const shortnameResponse = await handleApiResponse<ShortnameResponse>(response, setError);
      
      const allVersionsPromises = shortnameResponse.shortnames.map(shortname => 
        versionsApi.getAll(shortname.shortname)
      );
      
      const allVersionsResponses = await Promise.all(allVersionsPromises);
      
      const allVersions: Version[] = [];
      const versionMap = new Map<string, Version>();
      
      allVersionsResponses.forEach(response => {
        response.versions.forEach(version => {
          if (!versionMap.has(version.version)) {
            versionMap.set(version.version, version);
            allVersions.push(version);
          }
        });
      });
      
      return { versions: allVersions };
    } catch (error) {
      if (setError) setError(error instanceof Error ? error.message : 'Failed to fetch versions');
      throw error;
    }
  },

  createVersion: async (data: VersionFormData, setError?: (error: string) => void): Promise<Version> => {
    
    const shortnameName = `${data.version}`;
    
    try {
      
      try {
        await shortnamesApi.create({
          shortname: shortnameName,
          description: `Default shortname for version ${data.version}`
        });
      } catch (error) {
        
        console.log('Shortname may already exist, continuing...');
      }
      
      const response = await fetch(`${API_BASE_URL}/shortnames/${shortnameName}/versions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      
      return handleApiResponse<Version>(response, setError);
    } catch (error) {
      if (setError) setError(error instanceof Error ? error.message : 'Failed to create version');
      throw error;
    }
  },

  getVersionShortnames: async (version: string, setError?: (error: string) => void): Promise<ShortnameResponse> => {
    
    try {
      const response = await fetch(`${API_BASE_URL}/shortnames`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      const shortnameResponse = await handleApiResponse<ShortnameResponse>(response, setError);
      
      const shortnamesWithVersion: Shortname[] = [];
      
      for (const shortname of shortnameResponse.shortnames) {
        try {
          await versionsApi.getOne(shortname.shortname, version);
          shortnamesWithVersion.push(shortname);
        } catch (error) {
          
        }
      }
      
      return { shortnames: shortnamesWithVersion };
    } catch (error) {
      if (setError) setError(error instanceof Error ? error.message : 'Failed to fetch shortnames for version');
      throw error;
    }
  },

  createShortnameInVersion: async (version: string, data: ShortnameFormData, setError?: (error: string) => void): Promise<Shortname> => {
    
    try {
      const shortnameResponse = await shortnamesApi.create(data, setError);
      
      await versionsApi.create(shortnameResponse.shortname, {
        version: version,
        description: `Version ${version} for ${shortnameResponse.shortname}`,
        isActive: true
      });
      
      return shortnameResponse;
    } catch (error) {
      if (setError) setError(error instanceof Error ? error.message : 'Failed to create shortname in version');
      throw error;
    }
  },

  deleteVersion: async (version: string, setError?: (error: string) => void): Promise<ApiResponse<void>> => {
    
    try {
      const shortnamesResponse = await versionsApi.getVersionShortnames(version);
      
      for (const shortname of shortnamesResponse.shortnames) {
        await versionsApi.delete(shortname.shortname, version);
      }
      
      return { data: undefined, message: 'Version deleted successfully' };
    } catch (error) {
      if (setError) setError(error instanceof Error ? error.message : 'Failed to delete version');
      throw error;
    }
  },
  
  duplicateVersion: async (sourceVersion: string, newVersionData: VersionFormData, setError?: (error: string) => void): Promise<Version> => {
    try {
      
      const newVersion = await versionsApi.createVersion(newVersionData);
      
      const shortnamesResponse = await versionsApi.getVersionShortnames(sourceVersion);
      
      for (const shortname of shortnamesResponse.shortnames) {
        try {
          
          const newShortname = await versionsApi.createShortnameInVersion(newVersionData.version, {
            shortname: shortname.shortname,
            description: shortname.description
          });
          
          const configsResponse = await configurationsApi.getAll(shortname.shortname, sourceVersion);
          
          for (const config of configsResponse.configurations) {
            await configurationsApi.create(newShortname.shortname, newVersionData.version, {
              key: config.key,
              value: config.value,
              description: config.description
            });
          }
        } catch (err) {
          console.error(`Error duplicating shortname ${shortname.shortname}:`, err);
          
        }
      }
      
      return newVersion;
    } catch (error) {
      if (setError) setError(error instanceof Error ? error.message : 'Failed to duplicate version');
      throw error;
    }
  },

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
