
import React, { createContext, useContext, useState, useEffect } from 'react';
import { checkPin } from '@/lib/supabase';
import { AuthContextType } from '@/types';
import { toast } from 'sonner';

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Check if user is already logged in
  useEffect(() => {
    const auth = localStorage.getItem('pankti_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (pin: string): Promise<boolean> => {
    try {
      // Check PIN against the database
      const isValid = await checkPin(pin);
      
      if (isValid) {
        setIsAuthenticated(true);
        localStorage.setItem('pankti_auth', 'true');
        toast.success('Login successful');
        return true;
      }
      
      toast.error('Invalid PIN');
      return false;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed');
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('pankti_auth');
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
