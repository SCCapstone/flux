import React, { useState, useContext, useEffect, useCallback, useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import "../styles/BookList.css";  
import ReadlistPopup from './ReadlistPopup';

const BookList = ({ apiEndpoint, title, allowRemove = false, handleRemove, handleAdd, theme = 'light', readlistId }) => {
  const [selectedBook, setSelectedBook] = useState(null);
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

    if (readlistId) {
      try {
        const response = await fetch(`${apiBaseUrl}/readlists/update/`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            book_id: book.google_books_id,
            readlist_ids: [], // remove from this readlist
          }),
        });
  
        if (response.ok) {
          fetchBooks(); // Refresh list
        } else {
          console.error("Error removing book from readlist:", await response.json());
        }
      } catch (error) {
        console.error("Error during removal:", error);
      }
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

  const handleDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return;
  
    const reordered = Array.from(books);
    const [moved] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, moved);
    setBooks(reordered);

    if (readlistId) {
      try {
        await fetch(`${apiBaseUrl}/readlists/reorder-books/`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            readlist_id: readlistId,
            ordered_book_ids: reordered.map((book) => book.google_books_id),
          }),
        });
      } catch (error) {
        console.error("Error saving new book order:", error);
      }
    }
  };

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

      <DragDropContext onDragEnd={handleDragEnd}>
  <Droppable droppableId="booklist-droppable" direction="horizontal">
    {(provided) => (
      <div
        className="booklist-grid"
        ref={provided.innerRef}
        {...provided.droppableProps}
      >
        {filteredBooks.map((book, index) => (
          <Draggable
            key={book.google_books_id}
            draggableId={book.google_books_id}
            index={index}
          >
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                className={`booklist-card ${theme === 'dark' ? 'dark-card' : ''} ${snapshot.isDragging ? 'dragging' : ''}`}
              >
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
                    <strong>Author:</strong> {book.author}
                  </p>
                  <p className={`booklist-genre ${theme === 'dark' ? 'text-gray-300' : ''}`}>
                    <strong>Genre:</strong> {book.genre}
                  </p>
                  <p className={`booklist-year ${theme === 'dark' ? 'text-gray-300' : ''}`}>
                    <strong>Year:</strong> {book.year}
                  </p>
                  <button
                    className={`nav-button ${theme === 'dark' ? 'dark-button' : ''}`}
                    onClick={() => setSelectedBook(book)}
                  >
                    Manage Readlists
                  </button>
                  {allowRemove && (
                    <button className="remove-button" onClick={() => handleRemoveBook(book)}>
                      Remove
                    </button>
                  )}
                </div>
              </div>
            )}
          </Draggable>
        ))}
        
        {/* Always include the placeholder, even if no books */}
        {provided.placeholder}

        {/* Optional message (outside of conditional rendering) */}
        {filteredBooks.length === 0 && (
          <p className={`no-results ${theme === 'dark' ? 'text-gray-300' : ''}`}>No books found.</p>
        )}
      </div>
    )}
  </Droppable>
</DragDropContext>



      {/* Readlist Popup: Opens when a book is selected */}
      {selectedBook && (
        <ReadlistPopup
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onSave={() => {
            console.log("Closing ReadlistPopup after save");
            setSelectedBook(null);
            fetchBooks();
          }}
        />
      )}

    </div>
  );
};

export default BookList;
