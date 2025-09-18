/**
 * Configuration model class
 */
export class Configuration {
  configId: string;
  key: string;
  value: any;
  description: string;
  shortname: string;
  version: string;
  createdAt: string;
  updatedAt: string;

  constructor(data: Partial<Configuration>) {
    this.configId = data.configId || '';
    this.key = data.key || '';
    this.value = data.value;
    this.description = data.description || '';
    this.shortname = data.shortname || '';
    this.version = data.version || '';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
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
   * Get formatted value
   */
  getFormattedValue(): string {
    if (this.value === null || this.value === undefined) {
      return '';
    }
    
    if (typeof this.value === 'object') {
      try {
        return JSON.stringify(this.value, null, 2);
      } catch (error) {
        return String(this.value);
      }
    }
    
    return String(this.value);
  }

  /**
   * Get display key (without prefix)
   */
  getDisplayKey(): string {
    if (this.key.startsWith('public.')) {
      return this.key.substring(7);
    }
    return this.key;
  }

  /**
   * Convert to form data
   */
  toFormData(): ConfigurationFormData {
    return {
      key: this.key,
      value: this.value,
      description: this.description,
    };
  }

  /**
   * Create from API response
   */
  static fromApiResponse(data: any): Configuration {
    return new Configuration({
      configId: data.configId,
      key: data.key,
      value: data.value,
      description: data.description,
      shortname: data.shortname,
      version: data.version,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }
}

/**
 * Configuration form data interface
 */
export interface ConfigurationFormData {
  key: string;
  value: any;
  description: string;
}

/**
 * Configuration response interface
 */
export interface ConfigurationResponse {
  configurations: Configuration[];
}
