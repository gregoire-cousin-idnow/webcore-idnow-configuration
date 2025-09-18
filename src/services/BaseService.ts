import { getAuthHeaders } from '../config/api.config';

/**
 * Base service class for API calls
 */
export abstract class BaseService {
  /**
   * Handle API response
   * @param response - Fetch response
   * @param setError - Optional error setter function
   * @returns Parsed response data
   */
  protected async handleApiResponse<T>(
    response: Response,
    setError?: (error: string) => void
  ): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text();
      const errorMessage = errorText || 'An unexpected error occurred.';
      
      if (setError) {
        setError(errorMessage);
      }
      
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

  /**
   * Get authentication headers
   */
  protected getHeaders(): Record<string, string> {
    return getAuthHeaders();
  }

  /**
   * Make a GET request
   * @param url - API endpoint URL
   * @param setError - Optional error setter function
   * @returns Response data
   */
  protected async get<T>(url: string, setError?: (error: string) => void): Promise<T> {
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders()
    });
    
    return this.handleApiResponse<T>(response, setError);
  }

  /**
   * Make a POST request
   * @param url - API endpoint URL
   * @param data - Request body data
   * @param setError - Optional error setter function
   * @returns Response data
   */
  protected async post<T>(
    url: string,
    data: any,
    setError?: (error: string) => void
  ): Promise<T> {
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    
    return this.handleApiResponse<T>(response, setError);
  }

  /**
   * Make a PUT request
   * @param url - API endpoint URL
   * @param data - Request body data
   * @param setError - Optional error setter function
   * @returns Response data
   */
  protected async put<T>(
    url: string,
    data: any,
    setError?: (error: string) => void
  ): Promise<T> {
    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    
    return this.handleApiResponse<T>(response, setError);
  }

  /**
   * Make a DELETE request
   * @param url - API endpoint URL
   * @param setError - Optional error setter function
   * @returns Response data
   */
  protected async delete<T>(url: string, setError?: (error: string) => void): Promise<T> {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    
    return this.handleApiResponse<T>(response, setError);
  }
}
