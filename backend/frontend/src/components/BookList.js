import React, { useState, useContext, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import "../styles/BookList.css";  

const BookList = ({ apiEndpoint, title, allowRemove = false, handleRemove, handleAdd, theme = 'light' }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
  const [activeFilters, setActiveFilters] = useState({
    decade: "all",
    genre: "all",
  });

  const fetchBooks = useCallback(async () => {
    if (!user?.token) return;
    try {
      const response = await fetch(apiEndpoint, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setBooks(data.books || data); 
      }
    } catch (error) {
      console.error("Error fetching books:", error);
    }
  }, [user, apiEndpoint]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const { uniqueGenres, uniqueDecades } = useMemo(() => {
    const genres = new Set(books.map((book) => book.genre));
    const decades = new Set(
      books.map((book) => `${Math.floor(parseInt(book.year) / 10) * 10}s`)
    );
    return {
      uniqueGenres: ["all", ...Array.from(genres)].sort(),
      uniqueDecades: ["all", ...Array.from(decades)].sort(),
    };
  }, [books]);

  const handleRemoveBook = async (book) => {
    if (!allowRemove) return;

    if (handleRemove && typeof handleRemove === 'function') {
      await handleRemove(book);
      fetchBooks();
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/readlists/update/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          book_id: book.google_books_id,
          readlist_ids: [],
        }),
      });

      if (response.ok) {
        fetchBooks();
      } else {
        console.error("Error removing book:", await response.json());
      }
    } catch (error) {
      console.error("Error removing book:", error);
    }
  };

  const handleBookDetails = (book) => {
    navigate("/book-details", { state: { book } });
  };

  const handleFilterChange = (filterType, value) => {
    setActiveFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  // Filter the books based on decade and genre
  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchesDecade =
        activeFilters.decade === "all" ||
        `${Math.floor(parseInt(book.year) / 10) * 10}s` === activeFilters.decade;
      const matchesGenre =
        activeFilters.genre === "all" || book.genre === activeFilters.genre;
      return matchesDecade && matchesGenre;
    });
  }, [books, activeFilters]);

  return (
    <div className={`booklist-container ${theme === 'dark' ? 'dark-mode' : ''}`}>
      {title && (
        <div className="booklist-header">
          <h1 className={theme === 'dark' ? 'text-gray-200' : ''}>{title}</h1>
        </div>
      )}

      <div className={`booklist-controls ${theme === 'dark' ? 'dark-controls' : ''}`}>
        <div className="filter-group">
          <label className={theme === 'dark' ? 'text-gray-300' : ''}>Decade:</label>
          <select 
            className={theme === 'dark' ? 'dark-select' : ''} 
            onChange={(e) => handleFilterChange("decade", e.target.value)}
          >
            {uniqueDecades.map((decade) => (
              <option key={decade} value={decade}>
                {decade === "all" ? "All Decades" : decade}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className={theme === 'dark' ? 'text-gray-300' : ''}>Genre:</label>
          <select 
            className={theme === 'dark' ? 'dark-select' : ''} 
            onChange={(e) => handleFilterChange("genre", e.target.value)}
          >
            {uniqueGenres.map((genre) => (
              <option key={genre} value={genre}>
                {genre === "all" ? "All Genres" : genre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="booklist-grid">
        {filteredBooks.length > 0 ? (
          filteredBooks.map((book, index) => (
            <div key={index} className={`booklist-card ${theme === 'dark' ? 'dark-card' : ''}`}>
              {book.image && (
                <img
                  src={book.image}
                  alt={book.title}
                  className="booklist-cover"
                  onClick={() => handleBookDetails(book)}
                />
              )}
              <div className={`booklist-info ${theme === 'dark' ? 'dark-info' : ''}`}>
                <h3 
                  className={`booklist-title ${theme === 'dark' ? 'text-gray-200' : ''}`} 
                  onClick={() => handleBookDetails(book)}
                >
                  {book.title}
                </h3>
                <p className={`booklist-author ${theme === 'dark' ? 'text-gray-300' : ''}`}>
                  <strong className={theme === 'dark' ? 'text-gray-300' : ''}>Author:</strong> {book.author}
                </p>
                <p className={`booklist-genre ${theme === 'dark' ? 'text-gray-300' : ''}`}>
                  <strong className={theme === 'dark' ? 'text-gray-300' : ''}>Genre:</strong> {book.genre}
                </p>
                <p className={`booklist-year ${theme === 'dark' ? 'text-gray-300' : ''}`}>
                  <strong className={theme === 'dark' ? 'text-gray-300' : ''}>Year:</strong> {book.year}
                </p>

                {allowRemove && (
                  <button className="remove-button" onClick={() => handleRemoveBook(book)}>
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className={`no-results ${theme === 'dark' ? 'text-gray-300' : ''}`}>No books found.</p>
        )}
      </div>
    </div>
  );
};

export default BookList;
