/**
 * Version model class
 */
export class Version {
  versionId: string;
  version: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  shortname?: string;
  createdBy?: string;

  constructor(data: Partial<Version>) {
    this.versionId = data.versionId || '';
    this.version = data.version || '';
    this.description = data.description || '';
    this.isActive = data.isActive ?? true;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.shortname = data.shortname;
    this.createdBy = data.createdBy || 'System';
  }

  /**
   * Check if the version is active
   */
  isActiveVersion(): boolean {
    return this.isActive;
  }

  /**
   * Get formatted creation date
   */
  getFormattedCreationDate(): string {
    return new Date(this.createdAt).toLocaleString();
  }

  /**
   * Get formatted update date
   */
  getFormattedUpdateDate(): string {
    return new Date(this.updatedAt).toLocaleString();
  }

  /**
   * Convert to form data
   */
  toFormData(): VersionFormData {
    return {
      version: this.version,
      description: this.description,
      isActive: this.isActive,
    };
  }

  /**
   * Create from API response
   */
  static fromApiResponse(data: any): Version {
    return new Version({
      versionId: data.versionId,
      version: data.version,
      description: data.description,
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      shortname: data.shortname,
      createdBy: data.createdBy,
    });
  }
}

/**
 * Version form data interface
 */
export interface VersionFormData {
  version: string;
  description: string;
  isActive: boolean;
}

/**
 * Version response interface
 */
export interface VersionResponse {
  versions: Version[];
}
