import React, { createContext, useContext, useState, useEffect } from 'react';
import apiServerClient from '@/lib/apiServerClient';
import { claimPendingCheckoutProfile } from '@/lib/checkoutProfile.js';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  const applyAuthenticatedUser = (nextUser) => {
    const normalizedUser = nextUser
      ? {
          ...nextUser,
          name: nextUser.name || `${nextUser.firstName || ''} ${nextUser.lastName || ''}`.trim() || nextUser.email || '',
        }
      : null;

    setAuthenticated(true);
    setUser(normalizedUser);

    try {
      claimPendingCheckoutProfile(normalizedUser);
    } catch (error) {
      console.warn('Failed to sync pending checkout profile:', error);
    }
  };

  useEffect(() => {
    verifySession();
  }, []);

  const verifySession = async () => {
    try {
      const response = await apiServerClient.fetch('/auth/verify');
      if (!response.ok) {
        setAuthenticated(false);
        setUser(null);
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      if (data.authenticated) {
        applyAuthenticatedUser({
          userId: data.userId,
          email: data.email,
          name: data.name
        });
      } else {
        setAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Session verification error:', error);
      setAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await apiServerClient.fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Login failed');
    }

    const data = await response.json();
    applyAuthenticatedUser({
      userId: data.userId,
      email: data.email,
      name: data.name
    });
    
    return data;
  };

  const register = async (name, email, password) => {
    const response = await apiServerClient.fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Registration failed');
    }

    const data = await response.json();
    applyAuthenticatedUser({
      userId: data.userId,
      email: data.email,
      name: data.name
    });
    
    return data;
  };

  const updateProfile = async (profileFields) => {
    const response = await apiServerClient.fetch('/auth/update-profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileFields),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || 'Failed to update profile');
    }

    const data = await response.json();
    const returnedUser = data?.user || null;
    if (returnedUser || data?.name || data?.email) {
      const nextName = returnedUser
        ? `${returnedUser.firstName || ''} ${returnedUser.lastName || ''}`.trim() || profileFields?.name || user?.name
        : (data.name || profileFields?.name || user?.name);
      const nextEmail = returnedUser?.email || data?.email || profileFields?.email || user?.email;

      applyAuthenticatedUser({
        userId: returnedUser?.userId || data.userId || user?.userId,
        email: nextEmail,
        name: nextName,
        firstName: returnedUser?.firstName || profileFields?.firstName || user?.firstName || '',
        lastName: returnedUser?.lastName || profileFields?.lastName || user?.lastName || '',
      });
    }

    return data;
  };

  const changePassword = async ({ currentPassword, newPassword, confirmPassword }) => {
    const response = await apiServerClient.fetch('/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || 'Failed to change password');
    }

    return response.json();
  };

  const logout = async () => {
    try {
      await apiServerClient.fetch('/auth/logout', {
        method: 'POST'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAuthenticated(false);
      setUser(null);
    }
  };

  const value = {
    user,
    authenticated,
    loading,
    login,
    register,
    logout,
    verifySession,
    updateProfile,
    changePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
