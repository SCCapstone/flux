import React, { useState } from 'react';

function Home({ onLogout }) {
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1); // Current page
  const [sortMenuVisible, setSortMenuVisible] = useState(false); // Toggle for sort menu
  const [sortOption, setSortOption] = useState('title'); // Default sort option

  const fetchBooks = async (searchQuery, pageNumber, sort) => {
    setLoading(true);
    setError('');
    setBooks([]);
    try {
      const response = await fetch(`http://localhost:8000/api/search/?q=${searchQuery}&page=${pageNumber}&sort=${sort}`);
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

  const handleSearch = () => {
    if (!query.trim()) return;
    setPage(1); // Reset to page 1
    fetchBooks(query, 1, sortOption);
  };

  const handleNextPage = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchBooks(query, nextPage, sortOption);
  };

  const handlePreviousPage = () => {
    const prevPage = Math.max(1, page - 1);
    setPage(prevPage);
    fetchBooks(query, prevPage, sortOption);
  };

  const toggleSortMenu = () => {
    setSortMenuVisible(!sortMenuVisible);
  };

  const handleSort = (option) => {
    setSortOption(option); // Update sort option
    setPage(1); // Reset to page 1
    fetchBooks(query, 1, option); // Fetch books with the new sort option
    setSortMenuVisible(false); // Close the sort menu after selection
  };

  return (
    <div>
      <h2>Welcome to the Home Page</h2>
      <p>You are now logged in!</p>
      <input
        type="text"
        placeholder="Search for books"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button onClick={handleSearch}>Search</button>
      <button onClick={onLogout}>Logout</button>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Sort Menu */}
      <div style={{ margin: '20px 0', position: 'relative' }}>
        <button onClick={toggleSortMenu}>Sort by: {sortOption}</button>
        {sortMenuVisible && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              background: '#fff',
              border: '1px solid #ccc',
              boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
              zIndex: 1,
            }}
          >
            <button onClick={() => handleSort('title')} style={{ display: 'block', padding: '10px' }}>
              Title
            </button>
            <button onClick={() => handleSort('author')} style={{ display: 'block', padding: '10px' }}>
              Author
            </button>
            <button onClick={() => handleSort('genre')} style={{ display: 'block', padding: '10px' }}>
              Genre
            </button>
            <button onClick={() => handleSort('year')} style={{ display: 'block', padding: '10px' }}>
              Year
            </button>
          </div>
        )}
      </div>

      {/* Display Books */}
      <div style={{ marginTop: '20px' }}>
        {books.map((book, index) => (
          <div key={index} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
            <h3>{book.title}</h3>
            <p><strong>Genre:</strong> {book.genre}</p>
            <p><strong>Author:</strong> {book.author}</p>
            <p><strong>Year:</strong> {book.year}</p>
            <p><strong>Description:</strong> {book.description}</p>
            {book.image && <img src={book.image} alt={book.title} style={{ maxWidth: '150px' }} />}
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      <div style={{ marginTop: '20px' }}>
        <button onClick={handlePreviousPage} disabled={page === 1}>Previous</button>
        <span style={{ margin: '0 10px' }}>Page {page}</span>
        <button onClick={handleNextPage}>Next</button>
      </div>
    </div>
  );
}

export default Home;
