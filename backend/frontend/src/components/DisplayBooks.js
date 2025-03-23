import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../ThemeContext";
import ReadlistPopup from "./ReadlistPopup";
import "../styles/DisplayBooks.css";

const DisplayBooks = ({ books, loading, error }) => {
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);
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
        <div key={index} className={`book-card ${theme === 'dark' ? 'dark-card' : ''}`}>
          {book.image && (
            <img 
              src={book.image} 
              alt={book.title} 
              className="book-cover" 
              onClick={() => {
                console.log("Navigating to Book Details:", book);
                navigate("/book-details", { state: { book } });
              }} 
            />
          )}
          <div className="book-info">
            <h3 
              className={`book-title ${theme === 'dark' ? 'dark-title' : ''}`}
              onClick={() => {
                console.log("Navigating to Book Details:", book);
                navigate("/book-details", { state: { book } });
              }}
            >
              {book.title}
            </h3>
            <p 
              className={`book-author ${theme === 'dark' ? 'dark-author' : ''}`}
              onClick={() => {
                console.log("Navigating to Author Details:", book);
                navigate("/author-details", { state: { book } });
              }}
            >
              {book.author}
            </p>
            <p className={`book-genre ${theme === 'dark' ? 'dark-text' : ''}`}><strong>Genre:</strong> {book.genre}</p>
            <p className={`book-year ${theme === 'dark' ? 'dark-text' : ''}`}><strong>Year:</strong> {book.year}</p>
            <p className={`book-description ${theme === 'dark' ? 'dark-text' : ''}`}>{book.description}</p>
            
            {/* New Button: Opens Readlist Popup */}
            <button
              className={`nav-button ${theme === 'dark' ? 'dark-button' : ''}`}
              onClick={() => {
                console.log("Opening ReadlistPopup for book:", book);
                setSelectedBook(book);
              }}
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
          onSave={() => {
            console.log("Closing ReadlistPopup after save");
            setSelectedBook(null);
          }}
        />
      )}
    </div>
  );
};

export default DisplayBooks;
