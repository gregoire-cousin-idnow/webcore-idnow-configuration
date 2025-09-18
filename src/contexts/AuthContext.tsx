import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AuthState, User } from '../types';
import { authApi } from '../services/api';

// Define the initial state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true,
  error: null,
};

// Define action types
type AuthAction =
  | { type: 'LOGIN_REQUEST' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'REGISTER_REQUEST' }
  | { type: 'REGISTER_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'REGISTER_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };

// Create the auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_REQUEST':
    case 'REGISTER_REQUEST':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
    case 'REGISTER_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// Create the auth context
interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, userType: 'admin' | 'user', adminKey?: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the auth provider
interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, token },
        });
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } else {
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    dispatch({ type: 'LOGIN_REQUEST' });
    try {
      const response = await authApi.login({ email, password });
      const { token, user } = response.data;
      
      // Save to local storage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token },
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage,
      });
    }
  };

  // Register function
  const register = async (email: string, password: string, userType: 'admin' | 'user', adminKey?: string) => {
    dispatch({ type: 'REGISTER_REQUEST' });
    try {
      const response = await authApi.register({ email, password, confirmPassword: password, userType, adminKey });
      const { token, user } = response.data;
      
      // Save to local storage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      dispatch({
        type: 'REGISTER_SUCCESS',
        payload: { user, token },
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      dispatch({
        type: 'REGISTER_FAILURE',
        payload: errorMessage,
      });
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <AuthContext.Provider
      value={{
        state,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Create a hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
