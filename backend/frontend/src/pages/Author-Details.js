import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { FetchBooks } from '../components/FetchBooks';
import DisplayBooks from "../components/DisplayBooks.js";
import '../styles/AuthorDetails.css';

const AuthorDetails = () => {
  const locationRouter = useLocation();
  const [books, setBooks] = useState([]);
  const [query, setQuery] = useState('');
  const [favorites, setFavorites] = useState(() => {
    return JSON.parse(localStorage.getItem('favorites')) || [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [author, setAuthor] = useState('');
  const [authorStats, setAuthorStats] = useState({
    totalBooks: 0,
    averageRating: 0,
    genres: []
  });

  useEffect(() => {
    const fetchBooksByAuthor = async () => {
      if (locationRouter.state?.book) {
        const data = locationRouter.state.book;
        setAuthor(data.author);
        setQuery(data.author);
        try {
          setLoading(true);
          const fetchedBooks = await FetchBooks(data.author, 1, 'author');
          setBooks(fetchedBooks);
          
          const stats = {
            totalBooks: fetchedBooks.length,
            averageRating: fetchedBooks.reduce((acc, book) => acc + (book.average_rating || 0), 0) / fetchedBooks.length,
            genres: [...new Set(fetchedBooks.map(book => book.genre).filter(Boolean))]
          };
          setAuthorStats(stats);
          
          setPage(1);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchBooksByAuthor();
  }, [locationRouter.state]);

  const handleNextPage = async () => {
    setLoading(true);
    setError('');
    try {
      const newBooks = await FetchBooks(query, page + 1, 'author');
      if (newBooks && newBooks.length > 0) {
        setBooks(newBooks);
        setPage(prev => prev + 1);
        
        const stats = {
          totalBooks: newBooks.length,
          averageRating: newBooks.reduce((acc, book) => acc + (book.average_rating || 0), 0) / newBooks.length,
          genres: [...new Set(newBooks.map(book => book.genre).filter(Boolean))]
        };
        setAuthorStats(stats);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousPage = async () => {
    if (page <= 1) return;
    setLoading(true);
    setError('');
    try {
      const newBooks = await FetchBooks(query, page - 1, 'author');
      if (newBooks && newBooks.length > 0) {
        setBooks(newBooks);
        setPage(prev => prev - 1);
        
        const stats = {
          totalBooks: newBooks.length,
          averageRating: newBooks.reduce((acc, book) => acc + (book.average_rating || 0), 0) / newBooks.length,
          genres: [...new Set(newBooks.map(book => book.genre).filter(Boolean))]
        };
        setAuthorStats(stats);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = (book) => {
    const isFavorite = favorites.some((fav) => fav.title === book.title);
    const updatedFavorites = isFavorite
      ? favorites.filter((fav) => fav.title !== book.title)
      : [...favorites, book];
    setFavorites(updatedFavorites);
    localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="loading-container">
            <p className="loading-message">Loading author details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="error-container">
            <p className="error-message">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="author-header">
          <h1 className="author-name">{author}</h1>
          <div className="author-stats">
            <div className="stat-item">
              <span className="stat-label">Total Books</span>
              <span className="stat-value">{authorStats.totalBooks}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Average Rating</span>
              <span className="stat-value">
                {authorStats.averageRating ? authorStats.averageRating.toFixed(1) : 'N/A'}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Genres</span>
              <span className="stat-value">{authorStats.genres.length}</span>
            </div>
          </div>
          {authorStats.genres.length > 0 && (
            <div className="genres-list">
              <span className="stat-label">Writing in: </span>
              {authorStats.genres.map((genre, index) => (
                <span key={genre} className="genre-tag">
                  {genre}
                  {index < authorStats.genres.length - 1 ? ', ' : ''}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="books-section">
          <h2 className="section-title">Books by {author}</h2>
          <DisplayBooks
            books={books}
            favorites={favorites}
            handleFavorite={handleFavorite}
            loading={loading}
            error={error}
          />
        </div>

        <div className="pagination-container">
          <button 
            onClick={handlePreviousPage} 
            disabled={page === 1}
            className="pagination-button"
          >
            Previous
          </button>
          <span className="page-number">Page {page}</span>
          <button 
            onClick={handleNextPage}
            className="pagination-button"
            disabled={books.length === 0}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthorDetails;