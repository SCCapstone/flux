import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { ThemeContext } from '../ThemeContext';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import BookList from '../components/BookList'; 
import '../styles/Favorites.css';
import '../styles/Gamification.css';

const Favorites = () => {
  const navigate = useNavigate();
  const { user, refreshGamificationData } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const [notification, setNotification] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

  if (!user?.token) {
    return <p>Loading...</p>;
  }

  const handleAddFavorite = async (book) => {
    try {
      const response = await fetch(`${apiBaseUrl}/favorites/add/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ google_books_id: book.google_books_id, ...book }),
      });

      if (response.ok) {
        const data = await response.json();
        refreshGamificationData(); // Refresh gamification (level, points, achievements)

        // Display gamification notification
        if (data.gamification?.notification) {
          setNotification(data.gamification.notification);

          setTimeout(() => setNotification(null), 3000);
        }

        // Display achievements
        if (data.gamification?.achievements.length > 0) {
          setAchievements(data.gamification.achievements);
        }
      }
    } catch (error) {
      console.error('Error adding favorite:', error);
    }
  };

  const handleRemoveFavorite = async (book) => {
    try {
      const response = await fetch(`${apiBaseUrl}/favorites/remove/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ google_books_id: book.google_books_id }),
      });

      if (response.ok) {
        const data = await response.json();
        refreshGamificationData();

        // Display notification
        if (data.gamification?.notification) {
          setNotification(data.gamification.notification);
        
          // Show each achievement in the UI
          if (data.gamification.achievements?.length) {
            data.gamification.achievements.forEach((achievementMessage) => {
              setTimeout(() => {
                setNotification({
                  show: true,
                  message: achievementMessage,
                  type: 'success',
                  points: 0,
                });
              }, 1000);
            });
          }
        
          // Auto-hide notification after 3 seconds
          setTimeout(() => setNotification({ show: false }), 3000);
        }
        
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Navigation />

      <div className={`favorites-container ${theme === 'dark' ? 'dark-mode' : ''}`}>
        {/* Gamification Notification */}
        {notification && (
          <div className={`gamification-notification animate-in ${notification.type} ${theme === 'dark' ? 'dark-notification' : ''}`}>
            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>{notification.message}</p>
            {notification.points > 0 && (
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} font-bold`}>+{notification.points} points earned!</p>
            )}
          </div>
        )}

        {/* Achievement Notification */}
        {achievements.length > 0 && (
          <div className={`achievement-popup ${theme === 'dark' ? 'dark-achievement' : ''}`}>
            <div className={`achievement-popup-content ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`achievement-title ${theme === 'dark' ? 'text-gray-200' : ''}`}>🏆 New Achievement!</h3>
              {achievements.map((ach, index) => (
                <p key={index} className={`achievement-name ${theme === 'dark' ? 'text-gray-300' : ''}`}>{ach}</p>
              ))}
              <button onClick={() => setAchievements([])} className={`achievement-button ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : ''}`}>Close</button>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className={`text-2xl font-bold mb-3 ${theme === 'dark' ? 'text-gray-200' : ''}`}>My Favorites</h1>
          <BookList
            apiEndpoint={`${apiBaseUrl}/favorites/`}
            title="" 
            allowRemove={true}
            handleRemove={handleRemoveFavorite}
            handleAdd={handleAddFavorite}
            theme={theme}
          />
        </div>
      </div>
    </div>
  );
};

export default Favorites;
