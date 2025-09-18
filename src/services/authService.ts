import { User, LoginFormData, RegisterFormData } from '../models/Authentication';
import { authApi } from './api';

/**
 * AuthService: A dedicated service for handling authentication operations
 * This separates authentication logic from the React component tree
 */
class AuthService {
  /**
   * Check if a user is currently authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Get the current authentication token
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Get the current user
   */
  getUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr) as User;
    } catch (error) {
      this.logout();
      return null;
    }
  }

  /**
   * Login a user
   */
  async login(credentials: LoginFormData): Promise<{ user: User; token: string }> {
    try {
      const response = await authApi.login(credentials);
      this.setSession(response.token, response.user);
      return { user: response.user, token: response.token };
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  }

  /**
   * Register a new user
   */
  async register(data: RegisterFormData): Promise<{ user: User; token: string }> {
    try {
      const response = await authApi.register(data);
      this.setSession(response.token, response.user);
      return { user: response.user, token: response.token };
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  }

  /**
   * Logout the current user
   */
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  /**
   * Set the current session
   */
  private setSession(token: string, user: User): void {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }
}

// Export a singleton instance
export const authService = new AuthService();
