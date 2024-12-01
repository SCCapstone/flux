import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../AuthContext';
import StarRating from '../components/StarRating';
import '../styles/Home.css';
import { FetchBooks } from '../components/FetchBooks';
import DisplayBooks from "../components/DisplayBooks.js";

const Home = () => {
  const { handleLogout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState([]);
  const [favorites, setFavorites] = useState(() => {
    return JSON.parse(localStorage.getItem('favorites')) || [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [sortOption, setSortOption] = useState('title');

  const handleLogoutClick = async () => {
    try {
      await axios.post('http://127.0.0.1:8000/api/logout/', {}, {
        headers: {
          'X-CSRFToken': getCookie('csrftoken'),
        },
      });
      handleLogout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error.response || error.message);
      alert('Failed to logout. Please try again.');
    }
  };

  const goToProfile = () => {
    navigate('/profile');
  };

  const goToFavorites = () => {
    navigate('/favorites');
  };

  const goToBookDetails = () => {
    navigate('/book-details');
  };

  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith(`${name}=`)) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setBooks([]);
    try {
      const books = await FetchBooks(query, 1, sortOption);
      setBooks(books);
      setPage(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
};

  const handleNextPage = async () => {
    const nextPage = page + 1;
    setLoading(true);
    setError('');
    try {
      const books = await FetchBooks(query, nextPage, sortOption);
      setBooks(books);
      setPage(nextPage);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousPage = async () => {
    const prevPage = Math.max(1, page - 1);
    setLoading(true);
    setError('');
    try {
      const books = await FetchBooks(query, prevPage, sortOption);
      setBooks(books);
      setPage(prevPage);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = async (option) => {
    setSortOption(option);
    setLoading(true);
    setError('');
    try {
      const books = await FetchBooks(query, 1, option);
      setBooks(books);
      setPage(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setSortMenuVisible(false);
    }
  };

  const toggleSortMenu = () => {
    setSortMenuVisible(!sortMenuVisible);
  };


  const handleFavorite = (book) => {
    const isFavorite = favorites.some((fav) => fav.title === book.title);
    const updatedFavorites = isFavorite
      ? favorites.filter((fav) => fav.title !== book.title)
      : [...favorites, book];
    setFavorites(updatedFavorites);
    localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
  };

  return (
    <div className="home-container">
      <div className="header">
        <h1>Welcome to the Book Library</h1>
        <div className="nav-buttons">
          <button className="nav-button" onClick={goToProfile}>
            My Profile
          </button>
          <button className="nav-button" onClick={goToBookDetails}>
            Book Details
          </button>
          <button className="nav-button" onClick={goToFavorites}>
            Favorites
          </button>
          <button className="logout-button" onClick={handleLogoutClick}>
            Logout
          </button>
        </div>
      </div>

      <div className="search-section">
        <input
          type="text"
          className="search-input"
          placeholder="Search for books"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="search-button" onClick={handleSearch}>
          Search
        </button>
      </div>

      <div className="sort-menu">
        <button className="sort-button" onClick={toggleSortMenu}>
          Sort by: {sortOption}
        </button>
        {sortMenuVisible && (
          <div className="sort-dropdown">
            <button onClick={() => handleSort('title')}>Title</button>
            <button onClick={() => handleSort('author')}>Author</button>
            <button onClick={() => handleSort('genre')}>Genre</button>
            <button onClick={() => handleSort('year')}>Year</button>
          </div>
        )}
      </div>

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
  );
};

export default Home;
