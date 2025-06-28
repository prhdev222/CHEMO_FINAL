import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    console.log('🔐 AuthContext: Initializing with stored data', {
      hasToken: !!token,
      hasStoredUser: !!storedUser,
      tokenLength: token?.length || 0
    });
    
    if (token && storedUser) {
      const parsedUser = JSON.parse(storedUser);
      console.log('👤 AuthContext: Restoring user session', {
        userId: parsedUser.id,
        userEmail: parsedUser.email,
        userName: parsedUser.name
      });
      setUser(parsedUser);
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    const API_URL = import.meta.env.VITE_API_URL;
    console.log('🔑 Login attempt:', {
      email: email,
      apiUrl: API_URL,
      timestamp: new Date().toISOString()
    });
    
    try {
      const res = await fetch(`${API_URL}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      console.log('📡 Login API response:', {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('❌ Login failed:', {
          status: res.status,
          error: errorData.error,
          details: errorData
        });
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await res.json();
      console.log('✅ Login successful:', {
        userId: data.user.id,
        userEmail: data.user.email,
        tokenLength: data.token?.length || 0,
        hasToken: !!data.token
      });
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    } catch (error) {
      console.error('💥 Login error:', {
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  };

  const logout = () => {
    console.log('🚪 Logout initiated:', {
      userId: user?.id,
      userEmail: user?.email,
      timestamp: new Date().toISOString()
    });
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    
    console.log('✅ Logout completed');
  };

  const authInfo = { user, token, login, logout, loading };

  // Log auth state changes
  useEffect(() => {
    console.log('🔄 Auth state changed:', {
      hasUser: !!user,
      hasToken: !!token,
      loading: loading,
      userId: user?.id,
      userEmail: user?.email
    });
  }, [user, token, loading]);

  return (
    <AuthContext.Provider value={authInfo}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 