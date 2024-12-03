import React from 'react';
import { useNavigate } from 'react-router-dom';
import StarRating from './StarRating';
import '../styles/DisplayBooks.css'; // Create this CSS file for styling

const DisplayBooks = ({ books, favorites, handleFavorite, loading, error }) => {
  const navigate = useNavigate();

  if (loading) {
    return <p className="loading-message">Loading...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  if (!books.length) {
    return <p className="no-results">No books found.</p>;
  }

  return (
    <div className="book-grid">
      {books.map((book, index) => (
        <div key={index} className="book-card">
          {book.image && (
            <img src={book.image} alt={book.title} className="book-cover" />
          )}
          <div className="book-info">
            <h3 className="book-title"
              onClick={() => navigate('/book-details', { state: { book } })}>{book.title}</h3>
            <p className="author-name"
               onClick={() => navigate('/author-details', { state: { book } })}>{book.author}</p>
            <p className="book-genre"><strong>Genre:</strong> {book.genre}</p>
            <p className="book-year"><strong>Year:</strong> {book.year}</p>
            <p className="book-description">{book.description}</p>
            <StarRating
              totalStars={5}
              value={book.average_rating || 0}
              onRatingChange={(newRating) =>
                console.log(`Rated ${book.title}: ${newRating}`)}
            />
            <button
              className="nav-button"
              onClick={() => handleFavorite(book)}
            >
              {favorites.some((fav) => fav.title === book.title)
                ? 'Remove from Favorites'
                : 'Add to Favorites'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DisplayBooks;