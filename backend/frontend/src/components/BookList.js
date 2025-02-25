import React, { useState, useContext, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";

const BookList = ({ apiEndpoint, title, allowRemove = false }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
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
        setBooks(data.books || data); // Handling different API structures
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

    try {
      const response = await fetch("http://127.0.0.1:8000/api/readlists/update/", {
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

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchesDecade =
        activeFilters.decade === "all" ||
        `${Math.floor(parseInt(book.year) / 10) * 10}s` === activeFilters.decade;
      const matchesGenre = activeFilters.genre === "all" || book.genre === activeFilters.genre;
      return matchesDecade && matchesGenre;
    });
  }, [books, activeFilters]);

  return (
    <div>
      <h1>{title}</h1>

      <div>
        <label>Decade:</label>
        <select onChange={(e) => handleFilterChange("decade", e.target.value)}>
          {uniqueDecades.map((decade) => (
            <option key={decade} value={decade}>
              {decade === "all" ? "All Decades" : decade}
            </option>
          ))}
        </select>

        <label>Genre:</label>
        <select onChange={(e) => handleFilterChange("genre", e.target.value)}>
          {uniqueGenres.map((genre) => (
            <option key={genre} value={genre}>
              {genre === "all" ? "All Genres" : genre}
            </option>
          ))}
        </select>
      </div>

      <div>
        {filteredBooks.length > 0 ? (
          filteredBooks.map((book, index) => (
            <div key={index}>
              {book.image && (
                <img src={book.image} alt={book.title} onClick={() => handleBookDetails(book)} />
              )}
              <h3 onClick={() => handleBookDetails(book)}>{book.title}</h3>
              <p><strong>Author:</strong> {book.author}</p>
              <p><strong>Genre:</strong> {book.genre}</p>
              <p><strong>Year:</strong> {book.year}</p>
              {allowRemove && <button onClick={() => handleRemoveBook(book)}>Remove</button>}
            </div>
          ))
        ) : (
          <p>No books found.</p>
        )}
      </div>
    </div>
  );
};

export default BookList;
