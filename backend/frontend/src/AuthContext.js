import React, { createContext, useState, useEffect, useCallback } from 'react';

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      const token = localStorage.getItem('token');
      
      console.log("Loading auth from local storage:", 
        userData ? `User found: ${userData.username || 'no username'}` : "No user", 
        token ? "Token found" : "No token");
      
      if (userData && token) {
        // Ensure the username is present
        if (!userData.username) {
          console.error("User data missing username!");
          return null;
        }
        return { ...userData, token };
      }
      return null;
    } catch (error) {
      console.error("Error parsing user data from localStorage:", error);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return null;
    }
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
    
    // Ensure username is present
    if (!userData.username) {
      console.error('Login data missing username!');
      return;
    }

    const userToStore = {
      username: userData.username,
      email: userData.email || '',
      bio: userData.bio || '',
      token: userData.token
    };

    console.log('Storing user data:', userToStore);
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
          console.log('Verifying token');
          const response = await fetch('http://127.0.0.1:8000/api/verify-token/', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            console.log('Token verification successful');
            setIsLoggedIn(true);
            
            // If user context is empty but we have a valid token, try to restore from localStorage
            if (!user) {
              try {
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                  const userData = JSON.parse(storedUser);
                  if (userData && userData.username) {
                    console.log('Restoring user data from localStorage:', userData.username);
                    setUser({...userData, token});
                  }
                }
              } catch (error) {
                console.error('Error restoring user from localStorage:', error);
              }
            }
          } else {
            console.log('Token verification failed, logging out');
            handleLogout();
          }
        } catch (error) {
          console.error('Token verification error:', error);
          handleLogout();
        }
      } else {
        console.log('No token found, not logged in');
        setIsLoggedIn(false);
      }
    };

    verifyAuth();
  }, [handleLogout, user]);

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