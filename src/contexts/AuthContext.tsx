import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';

interface User {
  ID: number;
  Name: string;
  Email: string;
  CreateTime: string;
}

interface UserProfile {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  role: 'admin' | 'trader' | 'analyst' | 'viewer';
  department: string;
  permissions: Record<string, boolean>;
  api_access_level: 'basic' | 'premium' | 'enterprise';
  profile_image: string;
  last_login: string;
  is_active: boolean;
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: { user: User | null; profile: UserProfile | null } }
  | { type: 'LOGOUT' };

const initialState: AuthState = {
  user: null,
  profile: null,
  isAuthenticated: false,
  isLoading: true,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload.user,
        profile: action.payload.profile,
        isAuthenticated: !!action.payload.user,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        profile: null,
        isAuthenticated: false,
        isLoading: false,
      };
    default:
      return state;
  }
}

interface AuthContextType extends AuthState {
  login: (credentials: { email: string; password: string }) => Promise<{ error?: string }>;
  register: (credentials: { email: string; password: string }) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const fetchUserProfile = async (userId: number): Promise<UserProfile | null> => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(34154, {
        PageNo: 1,
        PageSize: 1,
        Filters: [{ name: 'user_id', op: 'Equal', value: userId }]
      });
      
      if (error) throw new Error(error);
      
      if (data?.List && data.List.length > 0) {
        const profile = data.List[0];
        return {
          ...profile,
          permissions: profile.permissions ? JSON.parse(profile.permissions) : {},
        };
      }
      
      // Create default profile if none exists
      const defaultProfile = {
        user_id: userId,
        first_name: '',
        last_name: '',
        role: 'viewer' as const,
        department: '',
        permissions: JSON.stringify({}),
        api_access_level: 'basic' as const,
        profile_image: '',
        last_login: new Date().toISOString(),
        is_active: true,
      };
      
      const { error: createError } = await window.ezsite.apis.tableCreate(34154, defaultProfile);
      if (createError) throw new Error(createError);
      
      return {
        ...defaultProfile,
        id: 0, // Will be set by database
        permissions: {},
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  const refreshUser = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { data: userData, error } = await window.ezsite.apis.getUserInfo();
      
      if (error || !userData) {
        dispatch({ type: 'LOGOUT' });
        return;
      }
      
      const profile = await fetchUserProfile(userData.ID);
      dispatch({ type: 'SET_USER', payload: { user: userData, profile } });
    } catch (error) {
      console.error('Error refreshing user:', error);
      dispatch({ type: 'LOGOUT' });
    }
  };

  const login = async (credentials: { email: string; password: string }) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { error } = await window.ezsite.apis.login(credentials);
      
      if (error) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return { error };
      }
      
      await refreshUser();
      toast({ title: 'Welcome back!', description: 'Successfully logged in.' });
      return {};
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      return { error: errorMessage };
    }
  };

  const register = async (credentials: { email: string; password: string }) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { error } = await window.ezsite.apis.register(credentials);
      
      dispatch({ type: 'SET_LOADING', payload: false });
      
      if (error) {
        return { error };
      }
      
      toast({ 
        title: 'Registration successful!', 
        description: 'Please check your email to verify your account.' 
      });
      return {};
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      return { error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await window.ezsite.apis.logout();
      dispatch({ type: 'LOGOUT' });
      toast({ title: 'Logged out', description: 'You have been successfully logged out.' });
    } catch (error) {
      console.error('Logout error:', error);
      dispatch({ type: 'LOGOUT' });
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!state.profile) return false;
    return state.profile.permissions[permission] === true;
  };

  const hasRole = (role: string): boolean => {
    if (!state.profile) return false;
    return state.profile.role === role;
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    hasPermission,
    hasRole,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}