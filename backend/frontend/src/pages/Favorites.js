import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import BookList from '../components/BookList'; 
import '../styles/Favorites.css';
import '../styles/Gamification.css';

const Favorites = () => {
  const navigate = useNavigate();
  const { user, refreshGamificationData } = useContext(AuthContext);
  const [notification, setNotification] = useState(null);
  const [achievements, setAchievements] = useState([]);

  // Ensure the user is authenticated
  if (!user?.token) {
    return <p>Loading...</p>;
  }

  const handleAddFavorite = async (book) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/favorites/add/', {
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

          // Auto-hide notification after 3 seconds
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
      const response = await fetch('http://127.0.0.1:8000/api/favorites/remove/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ book_id: book.google_books_id }),
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
                  points: 0, // No extra points beyond the initial award
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
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Gamification Notification */}
      {notification && (
        <div className={`gamification-notification animate-in ${notification.type}`}>
          <p className="text-sm font-medium text-gray-900">{notification.message}</p>
          {notification.points > 0 && (
            <p className="text-sm text-gray-600 font-bold">+{notification.points} points earned!</p>
          )}
        </div>
      )}

      {/* Achievement Notification */}
      {achievements.length > 0 && (
        <div className="achievement-popup">
          <div className="achievement-popup-content">
            <h3 className="achievement-title">🏆 New Achievement!</h3>
            {achievements.map((ach, index) => (
              <p key={index} className="achievement-name">{ach}</p>
            ))}
            <button onClick={() => setAchievements([])} className="achievement-button">Close</button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold">My Favorites</h1>

        {/* Use BookList Component to Display Favorites */}
        <BookList
          apiEndpoint="http://127.0.0.1:8000/api/favorites/"
          title="My Favorites"
          allowRemove={true}
          handleRemove={handleRemoveFavorite}
          handleAdd={handleAddFavorite}
        />
      </div>
    </div>
  );
};

export default Favorites;
