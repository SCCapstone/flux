import React, { useState, useContext, useEffect, useCallback } from 'react';
import { AuthContext } from '../AuthContext';
import Navigation from '../components/Navigation';
import '../styles/Home.css';
import DisplayBooks from "../components/DisplayBooks";

const Home = () => {
  const { user } = useContext(AuthContext);
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState('title');

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

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

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
        await fetchFavorites();
      } else {
        const errorData = await response.json();
        console.error('Server error:', errorData);
      }
    } catch (error) {
      console.error('Error updating favorites:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
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

        <DisplayBooks
          books={books}
          favorites={favorites}
          handleFavorite={handleFavorite}
          loading={loading}
          error={error}
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