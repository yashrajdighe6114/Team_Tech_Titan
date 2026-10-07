import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, User } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  demoSwitch: (role: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('assettrust_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await api.auth.me();
          setUser(res.user);
        } catch (e) {
          console.warn('Session expired or invalid. Switching to default demo account.');
          await demoSwitch('ASSET_OWNER');
        }
      } else {
        // Auto-login to ASSET_OWNER for frictionless hackathon demonstration
        await demoSwitch('ASSET_OWNER');
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const login = async (email: string, password: string = 'Password123!') => {
    const res = await api.auth.login({ email, password });
    localStorage.setItem('assettrust_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const demoSwitch = async (role: string) => {
    try {
      const res = await api.auth.demoSwitch({ role });
      localStorage.setItem('assettrust_token', res.token);
      setToken(res.token);
      setUser(res.user);
    } catch (e) {
      console.error('Demo switch failed:', e);
    }
  };

  const logout = () => {
    localStorage.removeItem('assettrust_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, demoSwitch, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
