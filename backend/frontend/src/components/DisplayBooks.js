import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ReadlistPopup from "./ReadlistPopup"; // Import the new popup component
import "../styles/DisplayBooks.css";

const DisplayBooks = ({ books, loading, error }) => {
  const navigate = useNavigate();
  const [selectedBook, setSelectedBook] = useState(null);

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
            <h3 className="book-title" onClick={() => navigate("/book-details", { state: { book } })}>
              {book.title}
            </h3>
            <p className="book-author" onClick={() => navigate("/author-details", { state: { book } })}>
              {book.author}
            </p>
            <p className="book-genre"><strong>Genre:</strong> {book.genre}</p>
            <p className="book-year"><strong>Year:</strong> {book.year}</p>
            <p className="book-description">{book.description}</p>
            
            {/* New Button: Opens Readlist Popup */}
            <button
              className="nav-button"
              onClick={() => setSelectedBook(book)}
            >
              Manage Readlists
            </button>
          </div>
        </div>
      ))}

      {/* Readlist Popup: Opens when a book is selected */}
      {selectedBook && (
        <ReadlistPopup
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onSave={() => setSelectedBook(null)}
        />
      )}
    </div>
  );
};

export default DisplayBooks;
