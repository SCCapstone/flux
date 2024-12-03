import React, { createContext, useState } from 'react';

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    return userData ? { ...userData, token } : null;
  });
  const [isLoggedIn, setIsLoggedIn] = useState(!!user);

  const handleLogin = (userData) => {
    // Only clear favorites for the user that's logging in
    localStorage.removeItem(`favorites_${userData.username}`);
    
    console.log('handleLogin received:', userData);
    const userToStore = {
      username: userData.username,
      email: userData.email,
      bio: userData.bio,
      token: userData.token
    };
    setUser(userToStore);
    setIsLoggedIn(true);
    localStorage.setItem('user', JSON.stringify(userToStore));
};

  const handleLogout = () => {
    if (user?.username) {
      localStorage.removeItem(`favorites_${user.username}`);
    }
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, handleLogin, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;