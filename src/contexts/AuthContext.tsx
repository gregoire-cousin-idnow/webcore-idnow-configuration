import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthState, LoginFormData, RegisterFormData } from '../models/Authentication';
import { authService } from '../services/authService';

type AuthContextState = Omit<AuthState, 'token'>;

interface AuthContextType {
  authState: AuthContextState;
  login: (credentials: LoginFormData) => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthContextState = {
  isAuthenticated: false,
  user: null,
  loading: false, 
  error: null,
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  
  const [authState, setAuthState] = useState<AuthContextState>(initialState);
  const [initialized, setInitialized] = useState(false);
  
  useEffect(() => {
    
    if (initialized) return;
    
    try {
      const user = authService.getUser();
      const isAuthenticated = authService.isAuthenticated();
      
      setAuthState({
        isAuthenticated,
        user,
        loading: false,
        error: null,
      });
    } catch (error) {
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      });
    }
    
    setInitialized(true);
  }, [initialized]);
  
  const login = useCallback(async (credentials: LoginFormData) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { user } = await authService.login(credentials);
      
      setAuthState({
        isAuthenticated: true,
        user,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: error.message || 'Login failed',
      }));
    }
  }, []);
  
  const register = useCallback(async (data: RegisterFormData) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { user } = await authService.register(data);
      
      setAuthState({
        isAuthenticated: true,
        user,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: error.message || 'Registration failed',
      }));
    }
  }, []);
  
  const logout = useCallback(() => {
    authService.logout();
    
    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null,
    });
  }, []);
  
  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);
  
  const contextValue = React.useMemo(() => ({
    authState,
    login,
    register,
    logout,
    clearError,
  }), [authState, login, register, logout, clearError]);
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
