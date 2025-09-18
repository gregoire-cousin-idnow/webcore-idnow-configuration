/**
 * Shortname model class
 */
export class Shortname {
  shortname: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;

  constructor(data: Partial<Shortname>) {
    this.shortname = data.shortname || '';
    this.description = data.description || '';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.createdBy = data.createdBy || 'System';
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
  toFormData(): ShortnameFormData {
    return {
      shortname: this.shortname,
      description: this.description,
    };
  }

  /**
   * Create from API response
   */
  static fromApiResponse(data: any): Shortname {
    return new Shortname({ 
      shortname: data.shortname, 
      description: data.description, 
      createdAt: data.createdAt, 
      updatedAt: data.updatedAt,
      createdBy: data.createdBy
    });
  }
}

/**
 * Shortname form data interface
 */
export interface ShortnameFormData {
  shortname: string;
  description: string;
}

/**
 * Shortname response interface
 */
export interface ShortnameResponse {
  shortnames: Shortname[];
}
