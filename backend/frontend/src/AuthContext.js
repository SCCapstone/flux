import React, { createContext, useState, useEffect, useCallback } from 'react';

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    return userData && token ? { ...userData, token } : null;
  });

  const [isLoggedIn, setIsLoggedIn] = useState(!!user);
  
  // Gamification states
  const [userPoints, setUserPoints] = useState(null);
  const [readingStreak, setReadingStreak] = useState(null);
  const [userLevel, setUserLevel] = useState(1);
  const [recentAchievements, setRecentAchievements] = useState([]);

  // Fetch gamification data
  const fetchGamificationData = useCallback(async (authToken) => {
    const token = authToken || (user && user.token);
    if (!token) return;
    
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
      };
      
      // Fetch user points and level
      const pointsResponse = await fetch('http://127.0.0.1:8000/api/user/points/', { headers });
      if (pointsResponse.ok) {
        const pointsData = await pointsResponse.json();
        setUserPoints(pointsData.total_points);
        setUserLevel(pointsData.level);
      }
      
      // Fetch reading streak
      const streakResponse = await fetch('http://127.0.0.1:8000/api/user/streak/', { headers });
      if (streakResponse.ok) {
        const streakData = await streakResponse.json();
        setReadingStreak(streakData);
      }
      
      // Fetch recent achievements (last 5)
      const achievementsResponse = await fetch('http://127.0.0.1:8000/api/user/achievements/', { headers });
      if (achievementsResponse.ok) {
        const achievementsData = await achievementsResponse.json();
        // Sort by date and get the 5 most recent
        const sortedAchievements = achievementsData
          .sort((a, b) => new Date(b.date_earned) - new Date(a.date_earned))
          .slice(0, 5);
        setRecentAchievements(sortedAchievements);
      }
    } catch (error) {
      console.error('Error fetching gamification data:', error);
    }
  }, [user]);

  const handleLogout = useCallback(() => {
    if (user?.username) {
      localStorage.removeItem(`favorites_${user.username}`);
    }
    setUser(null);
    setIsLoggedIn(false);
    setUserPoints(null);
    setReadingStreak(null);
    setUserLevel(1);
    setRecentAchievements([]);
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
    
    // Fetch initial gamification data after login
    fetchGamificationData(userData.token);
  }, [fetchGamificationData]);

  // Refresh gamification data
  const refreshGamificationData = useCallback(() => {
    fetchGamificationData();
  }, [fetchGamificationData]);

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
            // Fetch gamification data when token is verified
            fetchGamificationData(token);
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
  }, [handleLogout, fetchGamificationData]);

  const contextValue = {
    user,
    isLoggedIn,
    handleLogin,
    handleLogout,
    // Gamification data
    userPoints,
    userLevel,
    readingStreak,
    recentAchievements,
    refreshGamificationData
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;