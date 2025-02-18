import React, { createContext, useState, useEffect, useCallback } from 'react';

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    return userData && token ? { ...userData, token } : null;
  });

  const [isLoggedIn, setIsLoggedIn] = useState(!!user);

  const handleLogout = useCallback(() => {
    if (user?.username) {
      localStorage.removeItem(`favorites_${user.username}`);
    }
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }, [user]);

  const handleLogin = useCallback((userData) => {
    console.log('handleLogin received:', userData);
    
    if (!userData || !userData.token) {
      console.error('Invalid login data received:', userData);
      return;
    }

    const userToStore = {
      username: userData.username,
      email: userData.email,
      bio: userData.bio || '',
      token: userData.token
    };

    setUser(userToStore);
    setIsLoggedIn(true);

    localStorage.setItem('user', JSON.stringify(userToStore));
    localStorage.setItem('token', userData.token);
  }, []);

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          const response = await fetch('http://127.0.0.1:8000/api/verify-token/', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            setIsLoggedIn(true);
          } else {
            handleLogout();
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          handleLogout();
        }
      } else {
        setIsLoggedIn(false);
      }
    };

    verifyAuth();
  }, [handleLogout]);

  const contextValue = {
    user,
    isLoggedIn,
    handleLogin,
    handleLogout
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;