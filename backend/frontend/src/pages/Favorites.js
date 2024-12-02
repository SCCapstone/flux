import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import '../styles/Favorites.css';

const Favorites = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [favorites, setFavorites] = useState(() => {
    // Use user-specific key for favorites
    return JSON.parse(localStorage.getItem(`favorites_${user?.username}`)) || [];
  });
  const [sortOption, setSortOption] = useState('title');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);

  const handleRemove = (book) => {
    const updatedFavorites = favorites.filter((fav) => fav.id !== book.id);
    setFavorites(updatedFavorites);
    localStorage.setItem(`favorites_${user?.username}`, JSON.stringify(updatedFavorites));
  };

  const handleBookDetails = (book) => {
    navigate('/book-details', { state: { book } });
  };

  const toggleSortMenu = () => {
    setSortMenuVisible(!sortMenuVisible);
  };

  const handleSort = (option) => {
    setSortOption(option);

    const sortedFavorites = [...favorites].sort((a, b) => {
      if (option === 'title' || option === 'author' || option === 'genre' || option === 'year') {
        return a[option].localeCompare(b[option]);
      }
      return 0;
    });

    setFavorites(sortedFavorites);
    setSortMenuVisible(false);
  };

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

      <div className="favorites-grid">
        {favorites.length > 0 ? (
          favorites.map((book, index) => (
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
          <p className="no-favorites-message">You have no favorite books.</p>
        )}
      </div>
    </div>
  );
};

export default Favorites;