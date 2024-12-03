import React, { useState, useContext, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import '../styles/Favorites.css';

const Favorites = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [favorites, setFavorites] = useState([]);
  const [activeFilters, setActiveFilters] = useState({
    decade: 'all',
    genre: 'all'
  });

  useEffect(() => {
    if (user?.token) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
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
  };

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
        fetchFavorites();
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

  return (
    <div className="favorites-container">
      <div className="header">
        <h1>My Favorites</h1>
        <div className="nav-buttons">
          <button className="nav-button" onClick={() => navigate('/')}>
            Home
          </button>
          <button className="nav-button" onClick={() => navigate('/profile')}>
            My Profile
          </button>
        </div>
      </div>

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
    </div>
  );
};

export default Favorites;