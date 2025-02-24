import React, { useState, useContext, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import Navigation from '../components/Navigation';
import '../styles/Favorites.css';
import '../styles/Gamification.css';

const Favorites = () => {
  const navigate = useNavigate();
  const { user, refreshGamificationData } = useContext(AuthContext);
  const [favorites, setFavorites] = useState([]);
  const [activeFilters, setActiveFilters] = useState({
    decade: 'all',
    genre: 'all'
  });
  
  // Gamification states
  const [collectionAchievements, setCollectionAchievements] = useState([]);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success',
    points: 0
  });

  const fetchFavorites = useCallback(async () => {
    if (!user?.token) return;
    
    try {
      const response = await fetch('http://127.0.0.1:8000/api/favorites/', {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFavorites(data);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  }, [user]);
  
  // Fetch gamification data
  const fetchGamificationData = useCallback(async () => {
    if (!user?.token) return;
    
    try {
      const headers = {
        'Authorization': `Bearer ${user.token}`,
      };
      
      // Fetch user's achievements related to collections
      const achievementsResponse = await fetch('http://127.0.0.1:8000/api/user/achievements/', { headers });
      if (achievementsResponse.ok) {
        const achievementsData = await achievementsResponse.json();
        // Filter for collection-related achievements
        const collectionOnes = achievementsData.filter(a => 
          a.name.includes('Collector') || 
          a.name.includes('Enthusiast') || 
          a.name.includes('Book Lover')
        );
        setCollectionAchievements(collectionOnes);
      }
    } catch (error) {
      console.error('Error fetching gamification data:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
    fetchGamificationData();
  }, [fetchFavorites, fetchGamificationData]);

  const { uniqueGenres, uniqueDecades } = useMemo(() => {
    const genres = new Set(favorites.map(book => book.genre));
    const decades = new Set(
      favorites.map(book => `${Math.floor(parseInt(book.year) / 10) * 10}s`)
    );
    return {
      uniqueGenres: ['all', ...Array.from(genres)].sort(),
      uniqueDecades: ['all', ...Array.from(decades)].sort()
    };
  }, [favorites]);

  // Calculate progress to collection achievements
  const collectionProgress = useMemo(() => {
    const favoriteCount = favorites.length;
    const thresholds = [
      { name: 'Collector', target: 5, description: 'Add 5 books to favorites' },
      { name: 'Enthusiast', target: 25, description: 'Add 25 books to favorites' },
      { name: 'Book Lover', target: 50, description: 'Add 50 books to favorites' }
    ];
    
    return thresholds.map(threshold => {
      const existing = collectionAchievements.find(a => a.name === threshold.name);
      return {
        ...threshold,
        current: favoriteCount,
        percentage: Math.min(100, (favoriteCount / threshold.target) * 100),
        achieved: existing !== undefined
      };
    });
  }, [favorites.length, collectionAchievements]);

  const handleRemove = async (book) => {
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
        await fetchFavorites();
        // Refresh gamification data to update achievements
        refreshGamificationData();
      } else {
        const errorData = await response.json();
        console.error('Server error:', errorData);
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const handleBookDetails = (book) => {
    navigate('/book-details', { state: { book } });
  };

  const handleFilterChange = (filterType, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const filteredBooks = useMemo(() => {
    return favorites.filter(book => {
      const matchesDecade = activeFilters.decade === 'all' || 
        `${Math.floor(parseInt(book.year) / 10) * 10}s` === activeFilters.decade;
      const matchesGenre = activeFilters.genre === 'all' || 
        book.genre === activeFilters.genre;
      return matchesDecade && matchesGenre;
    });
  }, [favorites, activeFilters]);

  // Render collection achievements
  const renderCollectionAchievements = () => {
    return (
      <div className="bg-white shadow rounded-lg p-4 mb-6">
  <h2 className="text-xl font-bold mb-4">Collection Achievements</h2>
  <div className="space-y-4">
    {collectionProgress.map((achievement, index) => (
      <div key={index} className="relative">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center">
            <span className="mr-2">{achievement.achieved ? '🏆' : '🔒'}</span>
            <span className="font-medium">{achievement.name}</span>
          </div>
          <span className="text-sm text-gray-600">
            {achievement.current} / {achievement.target} books
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
          <div 
            className="h-2.5 rounded-full bg-blue-600"
            style={{ width: `${achievement.percentage}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500">{achievement.description}</p>
      </div>
    ))}
  </div>
</div>
    );
  };
  
  // Render earned badges
  const renderEarnedBadges = () => {
    if (collectionAchievements.length === 0) return null;
    
    return (
      <div className="mt-8 bg-white shadow rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">Earned Collection Badges</h2>
        <div className="flex flex-wrap gap-4">
          {collectionAchievements.map((achievement, index) => (
            <div key={index} className="flex flex-col items-center bg-yellow-50 rounded-lg p-3 border border-yellow-200">
              <div className="w-16 h-16 flex items-center justify-center bg-yellow-100 rounded-full mb-2">
                {achievement.badge_image ? (
                  <img 
                    src={achievement.badge_image} 
                    alt={achievement.name} 
                    className="w-12 h-12" 
                  />
                ) : (
                  <span className="text-3xl">🏆</span>
                )}
              </div>
              <h3 className="font-bold text-center">{achievement.name}</h3>
              <p className="text-xs text-gray-600 text-center">{achievement.description}</p>
              <span className="mt-1 text-xs font-semibold text-blue-600">+{achievement.points} points</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 max-w-xs bg-white rounded-lg shadow-lg p-4 border-l-4 border-green-500 z-50 animate-fade-in">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{notification.message}</p>
              {notification.points > 0 && (
                <p className="text-sm text-gray-600 font-bold">+{notification.points} points earned!</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Favorites</h1>
          
          {/* Collection Count Badge */}
          <div className="bg-blue-100 text-blue-800 py-2 px-4 rounded-full font-bold">
            <span>{favorites.length} {favorites.length === 1 ? 'Book' : 'Books'} in Collection</span>
          </div>
        </div>
        
        {/* Collection Achievements */}
        {renderCollectionAchievements()}

        <div className="controls-container">
          <div className="filters">
            <div className="filter-group">
              <label>Decade:</label>
              <select 
                value={activeFilters.decade}
                onChange={(e) => handleFilterChange('decade', e.target.value)}
              >
                {uniqueDecades.map(decade => (
                  <option key={decade} value={decade}>
                    {decade === 'all' ? 'All Decades' : decade}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Genre:</label>
              <select 
                value={activeFilters.genre}
                onChange={(e) => handleFilterChange('genre', e.target.value)}
              >
                {uniqueGenres.map(genre => (
                  <option key={genre} value={genre}>
                    {genre === 'all' ? 'All Genres' : genre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="favorites-grid">
          {filteredBooks.length > 0 ? (
            filteredBooks.map((book, index) => (
              <div key={index} className="favorite-card">
                {book.image && (
                  <img src={book.image} alt={book.title} className="favorite-cover" />
                )}
                <div className="favorite-info">
                  <h3
                    className="favorite-title"
                    onClick={() => handleBookDetails(book)}
                  >
                    {book.title}
                  </h3>
                  <p>
                    <strong>Author:</strong> {book.author}
                  </p>
                  <p>
                    <strong>Genre:</strong> {book.genre}
                  </p>
                  <p>
                    <strong>Year:</strong> {book.year}
                  </p>
                  <button
                    className="remove-button"
                    onClick={() => handleRemove(book)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="no-favorites-message">
              {favorites.length === 0 
                ? "You have no favorite books."
                : "No books match the selected filters."}
            </p>
          )}
        </div>
        
        {/* Badges Showcase */}
        {renderEarnedBadges()}
      </div>
    </div>
  );
};

export default Favorites;