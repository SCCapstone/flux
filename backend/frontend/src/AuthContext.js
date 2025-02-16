import React, { createContext, useState, useEffect, useCallback } from 'react';

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    return storedUser && token ? { ...storedUser, token } : null;
  });

  const [isLoggedIn, setIsLoggedIn] = useState(!!user);
  const [xp, setXp] = useState(() => Number(localStorage.getItem('xp')) || 0);
  const [achievements, setAchievements] = useState(() => JSON.parse(localStorage.getItem('achievements')) || []);

  // Function to handle login
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
    localStorage.setItem('xp', xp);
    localStorage.setItem('achievements', JSON.stringify(achievements));
  }, [xp, achievements]);

  // Function to handle logout
  const handleLogout = useCallback(() => {
    if (user?.username) {
      localStorage.removeItem(`favorites_${user.username}`);
    }
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('xp');
    localStorage.removeItem('achievements');
  }, [user]);

  // Function to verify token
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

  // Function to add XP and unlock achievements
  const addXp = (amount, achievement) => {
    setXp((prevXp) => {
      const newXp = prevXp + amount;
      localStorage.setItem('xp', newXp);
      return newXp;
    });

    if (achievement && !achievements.includes(achievement)) {
      const updatedAchievements = [...achievements, achievement];
      setAchievements(updatedAchievements);
      localStorage.setItem('achievements', JSON.stringify(updatedAchievements));
    }
  };

  // Function to unlock an achievement
  const unlockAchievement = (newAchievement) => {
    if (!achievements.includes(newAchievement)) {
      const updatedAchievements = [...achievements, newAchievement];
      setAchievements(updatedAchievements);
      localStorage.setItem('achievements', JSON.stringify(updatedAchievements));
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, xp, achievements, handleLogin, handleLogout, addXp, unlockAchievement }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
