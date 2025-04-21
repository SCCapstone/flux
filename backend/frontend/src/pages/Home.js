import React, { useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { ThemeContext } from '../ThemeContext';
import Navigation from '../components/Navigation';
import DisplayBooks from "../components/DisplayBooks";
import '../styles/Home.css';
import '../styles/Gamification.css';

const Home = () => {
  const navigate = useNavigate();
  const { user, readingStreak, refreshGamificationData } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState('title');
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
  
  // Pagination states
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const resultsPerPage = 10; // Adjust to match backend page size
  const [isEstimatingPages, setIsEstimatingPages] = useState(true);
  
  // Gamification states
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success',
    points: 0
  });
  const [showChallenges] = useState(false);
  const [challenges, setChallenges] = useState([]);

  const fetchFavorites = useCallback(async () => {
    if (!user?.token) return;
    
    try {
      const response = await fetch(`${apiBaseUrl}/favorites/`, {
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
  }, [user, apiBaseUrl]);
  
  // Fetch active challenges
  const fetchChallenges = useCallback(async () => {
    if (!user?.token) return;
    
    try {
      const response = await fetch(`${apiBaseUrl}/user/challenges/`, {
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
  }, [user, apiBaseUrl]);

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
        `${apiBaseUrl}/search/?${queryParams.toString()}`
      );
  
      if (!response.ok) {
        throw new Error('Failed to fetch books');
      }
  
      const data = await response.json();
      const booksList = data.books || [];
      setBooks(booksList);
      
      // If API provides pagination info, use it and mark as not estimating
      if (data.totalResults !== undefined && data.totalPages !== undefined) {
        setTotalResults(data.totalResults);
        setTotalPages(data.totalPages);
        setIsEstimatingPages(false);
      } else {
        // We need to estimate - more consistent approach
        if (pageNumber === 1) {
          // First query - reset estimation state
          setIsEstimatingPages(true);
          
          if (booksList.length === 0) {
            // No results
            setTotalPages(0);
            setTotalResults(0);
          } else {
            // Has results on first page
            const isFullPage = booksList.length === resultsPerPage;
            
            if (isFullPage) {
              // If we have a full page, set total to a reasonable number that won't change frequently
              // For example, estimate 5 total pages initially
              setTotalPages(5);
              setTotalResults(5 * resultsPerPage);
            } else {
              // Partial first page - this is likely all there is
              setTotalPages(1);
              setTotalResults(booksList.length);
              setIsEstimatingPages(false); // We're certain now
            }
          }
        } else {
          // Not the first page
          if (booksList.length === 0) {
            // Empty page - we've reached the end
            setTotalPages(pageNumber - 1);
            setTotalResults((pageNumber - 1) * resultsPerPage);
            setIsEstimatingPages(false); // We're certain now
            
            // Go back to last valid page
            setPage(pageNumber - 1);
            fetchBooks(searchQuery, pageNumber - 1, filter);
            return;
          } else {
            const isFullPage = booksList.length === resultsPerPage;
            
            if (!isFullPage) {
              // Partial page - this is the last one
              setTotalPages(pageNumber);
              setTotalResults((pageNumber - 1) * resultsPerPage + booksList.length);
              setIsEstimatingPages(false); // We're certain now
            } else if (pageNumber >= totalPages - 1) {
              // We're approaching our estimate, expand it
              // This prevents the "page X of Y" from constantly increasing
              setTotalPages(pageNumber + 3); // Add a buffer
            }
            // Otherwise keep the existing total pages estimate
          }
        }
      }
    } catch (err) {
      setError(err.message);
      setBooks([]);
      setTotalResults(0);
      setTotalPages(0);
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
    if (page < totalPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchBooks(query, nextPage, filterType);
    }
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
      const response = await fetch(`${apiBaseUrl}/favorites/${isFavorite ? 'remove' : 'add'}/`, {
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
            message: data.gamification.notification?.message || 'Added to favorites!',
            type: data.gamification.notification?.type || 'success',
            points: data.gamification.notification?.points  || 0
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
      const response = await fetch(`${apiBaseUrl}/books/${book.id}/update-status/`, {
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
    <div className={`home-page min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Navigation />
      
      {/* Gamification Notification */}
      {notification.show && (
        <div className={`fixed top-20 right-4 max-w-xs ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-4 border-l-4 border-green-500 z-50 animate-fade-in`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>{notification.message}</p>
              {notification.points > 0 && (
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-bold`}>+{notification.points} points earned!</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Reading streak reminder (show only if logged in) */}
      {user && readingStreak && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="streak-reminder">
            <div className="streak-reminder-text">
              <p>
                {readingStreak.is_active 
                  ? `${readingStreak.current_streak} day streak! Keep it up!` 
                  : "Don't break your streak! Mark a book as read today."}
              </p>
              <p>
                Reading daily helps you progress faster and earn more achievements.
              </p>
            </div>
            <button onClick={() => navigate('/challenges')} className="view-challenges-btn">
              View Challenges
            </button>
          </div>
        </div>
      )}
      
      {/* Active Challenges */}
      {showChallenges && challenges.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 mb-6 mt-4">
          <div className={`rounded-lg shadow p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-bold mb-3 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>Active Reading Challenges</h3>
            <div className="space-y-4">
              {challenges.map(challenge => (
                <div key={challenge.id} className={`border rounded-lg p-3 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>{challenge.name}</h4>
                    <span className={`text-sm py-1 px-2 rounded ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                      {challenge.days_remaining} days left
                    </span>
                  </div>
                  <div className={`flex justify-between text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    <span>Progress: {challenge.books_read} / {challenge.target_books} books</span>
                    <span>{challenge.progress_percentage}%</span>
                  </div>
                  <div className={`w-full rounded-full h-2 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
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

        {/* Modified pagination section */}
        {(books.length > 0 || totalPages > 0) && (
  <div className="pagination">
    <button 
      onClick={handlePreviousPage} 
      disabled={page === 1}
    >
      Previous
    </button>
    <span className="page-number">
      {isEstimatingPages 
        ? `Page ${page}` // When estimating, just show current page
        : `Page ${page} of ${totalPages}`} {/* Show "of X" only when we're certain */}
    </span>
    <button 
      onClick={handleNextPage}
      disabled={page >= totalPages && !isEstimatingPages}
    >
      Next
    </button>
  </div>
)}
      </div>
    </div>
  );
};

export default Home;