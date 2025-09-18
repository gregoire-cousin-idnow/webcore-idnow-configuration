import { API_ENDPOINTS } from '../config/api.config';
import { Version, VersionFormData, VersionResponse } from '../models';
import { BaseService } from './BaseService';
import { ShortnameResponse } from '../models/Shortname';

/**
 * Version service class
 */
export class VersionService extends BaseService {
  /**
   * Get all versions
   * @param setError - Optional error setter function
   * @returns Version response
   */
  async getAllVersions(setError?: (error: string) => void): Promise<VersionResponse> {
    try {
      // Use the direct endpoint to get all versions
      return this.get<VersionResponse>(API_ENDPOINTS.VERSIONS.ALL, setError);
    } catch (error) {
      if (setError) setError(error instanceof Error ? error.message : 'Failed to fetch versions');
      throw error;
    }
  }

  /**
   * Create a new version
   * @param data - Version form data
   * @param setError - Optional error setter function
   * @returns Created version
   */
  async createVersion(data: VersionFormData, setError?: (error: string) => void): Promise<Version> {
    try {
      // Create the version as a top-level entity
      const url = API_ENDPOINTS.VERSIONS.CREATE;
      return this.post<Version>(url, data, setError);
    } catch (error) {
      if (setError) setError(error instanceof Error ? error.message : 'Failed to create version');
      throw error;
    }
  }

  /**
   * Get shortnames for a version
   * @param version - Version string
   * @param setError - Optional error setter function
   * @returns Shortname response
   */
  async getVersionShortnames(version: string, setError?: (error: string) => void): Promise<ShortnameResponse> {
    try {
      // Use the direct endpoint to get shortnames for a version
      const url = API_ENDPOINTS.VERSIONS.SHORTNAMES(version);
      return this.get<ShortnameResponse>(url, setError);
    } catch (error) {
      if (setError) setError(error instanceof Error ? error.message : 'Failed to fetch shortnames for version');
      throw error;
    }
  }

  /**
   * Create a shortname in a version
   * @param version - Version string
   * @param data - Shortname form data
   * @param setError - Optional error setter function
   * @returns Created shortname
   */
  async createShortnameInVersion(
    version: string,
    data: { shortname: string; description: string },
    setError?: (error: string) => void
  ): Promise<any> {
    try {
      // Post directly to the version's shortnames endpoint
      const url = API_ENDPOINTS.VERSIONS.SHORTNAMES(version);
      return this.post<any>(url, data, setError);
    } catch (error) {
      if (setError) setError(error instanceof Error ? error.message : 'Failed to create shortname in version');
      throw error;
    }
  }

  /**
   * Delete a version
   * @param version - Version string
   * @param setError - Optional error setter function
   * @returns API response
   */
  async deleteVersion(version: string, setError?: (error: string) => void): Promise<any> {
    try {
      // Delete the version from the top-level versions endpoint
      const url = API_ENDPOINTS.VERSIONS.DETAIL_BY_ID(version);
      return this.delete(url, setError);
    } catch (error) {
      if (setError) setError(error instanceof Error ? error.message : 'Failed to delete version');
      throw error;
    }
  }

  /**
   * Duplicate a version
   * @param sourceVersion - Source version string
   * @param newVersionData - New version form data
   * @param setError - Optional error setter function
   * @returns Created version
   */
  async duplicateVersion(
    sourceVersion: string,
    newVersionData: VersionFormData,
    setError?: (error: string) => void
  ): Promise<Version> {
    try {
      // 1. Create the new version first as a top-level entity
      const newVersion = await this.createVersion(newVersionData);
      
      // 2. Get all shortnames associated with the source version
      const shortnamesResponse = await this.getVersionShortnames(sourceVersion);
      
      // 3. For each shortname in the source version, create it in the new version
      for (const shortname of shortnamesResponse.shortnames) {
        try {
          // Create the shortname in the new version
          const newShortname = await this.createShortnameInVersion(newVersionData.version, {
            shortname: shortname.shortname,
            description: shortname.description
          });
          
          // Get all configurations for this shortname in the source version
          const configsUrl = API_ENDPOINTS.CONFIGURATIONS.BY_VERSION(shortname.shortname, sourceVersion);
          const configsResponse = await this.get<any>(configsUrl);
          
          // Create each configuration in the new version
          for (const config of configsResponse.configurations) {
            const newConfigUrl = API_ENDPOINTS.CONFIGURATIONS.BY_VERSION(
              shortname.shortname, // Use the same shortname
              newVersionData.version // But with the new version
            );
            
            await this.post(newConfigUrl, {
              key: config.key,
              value: config.value,
              description: config.description
            });
          }
        } catch (err) {
          console.error(`Error duplicating shortname ${shortname.shortname}:`, err);
          // Continue with other shortnames even if one fails
        }
      }
      
      return newVersion;
    } catch (error) {
      if (setError) setError(error instanceof Error ? error.message : 'Failed to duplicate version');
      throw error;
    }
  }

  /**
   * Get all versions for a shortname
   * @param shortname - Shortname string
   * @param setError - Optional error setter function
   * @returns Version response
   */
  async getAll(shortname: string, setError?: (error: string) => void): Promise<VersionResponse> {
    const url = API_ENDPOINTS.VERSIONS.BY_SHORTNAME(shortname);
    return this.get<VersionResponse>(url, setError);
  }

  /**
   * Get a specific version
   * @param shortname - Shortname string
   * @param version - Version string
   * @param setError - Optional error setter function
   * @returns Version
   */
  async getOne(shortname: string, version: string, setError?: (error: string) => void): Promise<Version> {
    const url = API_ENDPOINTS.VERSIONS.DETAIL(shortname, version);
    return this.get<Version>(url, setError);
  }

  /**
   * Create a version for a shortname
   * @param shortname - Shortname string
   * @param data - Version form data
   * @param setError - Optional error setter function
   * @returns Created version
   */
  async create(shortname: string, data: VersionFormData, setError?: (error: string) => void): Promise<Version> {
    const url = API_ENDPOINTS.VERSIONS.BY_SHORTNAME(shortname);
    return this.post<Version>(url, data, setError);
  }

  /**
   * Update a version
   * @param shortname - Shortname string
   * @param version - Version string
   * @param data - Version form data
   * @param setError - Optional error setter function
   * @returns Updated version
   */
  async update(
    shortname: string,
    version: string,
    data: VersionFormData,
    setError?: (error: string) => void
  ): Promise<Version> {
    const url = API_ENDPOINTS.VERSIONS.DETAIL(shortname, version);
    return this.put<Version>(url, data, setError);
  }

  /**
   * Delete a version by shortname and version
   * @param shortname - Shortname string
   * @param version - Version string
   * @param setError - Optional error setter function
   * @returns API response
   */
  async deleteByShortname(shortname: string, version: string, setError?: (error: string) => void): Promise<any> {
    const url = API_ENDPOINTS.VERSIONS.DETAIL(shortname, version);
    return this.delete(url, setError);
  }
}

// Export singleton instance
export const versionService = new VersionService();
