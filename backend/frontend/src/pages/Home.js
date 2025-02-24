import React, { useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import Navigation from '../components/Navigation';
import DisplayBooks from "../components/DisplayBooks";
import '../styles/Home.css';
import '../styles/Gamification.css';

const Home = () => {
  const navigate = useNavigate();
  const { user, readingStreak, userPoints, refreshGamificationData } = useContext(AuthContext);
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState('title');
  
  // Gamification states
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success',
    points: 0
  });
  const [showChallenges, setShowChallenges] = useState(false);
  const [challenges, setChallenges] = useState([]);

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
  
  // Fetch active challenges
  const fetchChallenges = useCallback(async () => {
    if (!user?.token) return;
    
    try {
      const response = await fetch('http://127.0.0.1:8000/api/user/challenges/', {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Filter to show only active challenges
        const activeOnes = data.filter(c => !c.completed && c.days_remaining > 0);
        setChallenges(activeOnes);
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
    fetchChallenges();
  }, [fetchFavorites, fetchChallenges]);

  const fetchBooks = async (searchQuery, pageNumber, filter) => {
    setLoading(true);
    setError('');
    try {
      const queryParams = new URLSearchParams({
        q: searchQuery,
        page: pageNumber,
        filterType: filter
      });

      const response = await fetch(
        `http://localhost:8000/api/search/?${queryParams.toString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch books');
      }

      const data = await response.json();
      setBooks(data.books || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setPage(1);
    fetchBooks(query, 1, filterType);
  };

  const handleNextPage = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchBooks(query, nextPage, filterType);
  };

  const handlePreviousPage = () => {
    const prevPage = Math.max(1, page - 1);
    setPage(prevPage);
    fetchBooks(query, prevPage, filterType);
  };

  const handleFilterChange = (filter) => {
    setFilterType(filter);
    if (query.trim()) {
      setPage(1);
      fetchBooks(query, 1, filter);
    }
  };

  const handleFavorite = async (book) => {
    if (!user?.token) return;

    const isFavorite = favorites.some((fav) => fav.google_books_id === book.id);
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/favorites/${isFavorite ? 'remove' : 'add'}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(isFavorite ? 
          { book_id: book.id } : 
          {
            id: book.id,
            title: book.title,
            author: book.author,
            description: book.description || '',
            genre: book.genre || 'Unknown Genre',
            image: book.image || '',
            year: book.year || 'N/A'
          }
        ),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Handle gamification feedback if adding a favorite
        if (!isFavorite && data.gamification) {
          setNotification({
            show: true,
            message: 'Added to favorites!',
            type: 'success',
            points: data.gamification.points_earned
          });
          
          // Refresh gamification data
          refreshGamificationData();
          
          // Hide notification after 3 seconds
          setTimeout(() => {
            setNotification(prev => ({...prev, show: false}));
          }, 3000);
        }
        
        await fetchFavorites();
      } else {
        const errorData = await response.json();
        console.error('Server error:', errorData);
      }
    } catch (error) {
      console.error('Error updating favorites:', error);
    }
  };

  // Function to handle updating book reading status
  const handleUpdateBookStatus = async (book, status) => {
    if (!user?.token) return;
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/books/${book.id}/update-status/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // If the status is "FINISHED" and we have gamification data
        if (status === 'FINISHED' && data.gamification) {
          setNotification({
            show: true,
            message: 'Book finished! Great job!',
            type: 'success',
            points: data.gamification.points_earned
          });
          
          // Refresh gamification data
          refreshGamificationData();
          
          // Refresh challenges
          fetchChallenges();
          
          // Hide notification after 3 seconds
          setTimeout(() => {
            setNotification(prev => ({...prev, show: false}));
          }, 3000);
        }
      }
    } catch (error) {
      console.error('Error updating book status:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Gamification Notification */}
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
      
      {/* Reading streak reminder (show only if logged in) */}
      {user && readingStreak && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-full p-2 mr-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium">
                  {readingStreak.is_active 
                    ? `${readingStreak.current_streak} day streak! Keep it up!` 
                    : "Don't break your streak! Mark a book as read today."}
                </p>
                <p className="text-sm text-gray-600">
                  Reading daily helps you progress faster and earn more achievements.
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowChallenges(!showChallenges)}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
            >
              {showChallenges ? "Hide Challenges" : "View Challenges"}
            </button>
          </div>
        </div>
      )}
      
      {/* Active Challenges */}
      {showChallenges && challenges.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 mb-6 mt-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-bold mb-3">Active Reading Challenges</h3>
            <div className="space-y-4">
              {challenges.map(challenge => (
                <div key={challenge.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">{challenge.name}</h4>
                    <span className="text-sm bg-blue-100 text-blue-800 py-1 px-2 rounded">
                      {challenge.days_remaining} days left
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress: {challenge.books_read} / {challenge.target_books} books</span>
                    <span>{challenge.progress_percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${challenge.progress_percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="search-section">
          <form onSubmit={handleSearch} className="search-controls">
            <select
              className="filter-select"
              value={filterType}
              onChange={(e) => handleFilterChange(e.target.value)}
            >
              <option value="title">Search by Title</option>
              <option value="author">Search by Author</option>
              <option value="genre">Search by Genre</option>
            </select>

            <input
              type="text"
              className="search-input"
              placeholder={`Search by ${filterType}...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            
            <button type="submit" className="search-button">
              Search
            </button>
          </form>
        </div>

        {loading && <p className="loading-message">Loading...</p>}
        {error && <p className="error-message">{error}</p>}

        {/* Pass handleUpdateBookStatus function to DisplayBooks component */}
        <DisplayBooks
          books={books}
          favorites={favorites}
          handleFavorite={handleFavorite}
          handleUpdateBookStatus={handleUpdateBookStatus}
          loading={loading}
          error={error}
          user={user}
        />

        <div className="pagination">
          <button onClick={handlePreviousPage} disabled={page === 1}>
            Previous
          </button>
          <span className="page-number">Page {page}</span>
          <button onClick={handleNextPage}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default Home;