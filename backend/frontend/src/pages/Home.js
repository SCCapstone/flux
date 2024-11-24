import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../AuthContext'; // Import AuthContext for global state management

const Home = () => {
  const { handleLogout } = useContext(AuthContext); // Access the logout function from context
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1); // Current page
  const [sortMenuVisible, setSortMenuVisible] = useState(false); // Toggle for sort menu
  const [sortOption, setSortOption] = useState('title'); // Default sort option

  // Logout functionality
  const handleLogoutClick = async () => {
    try {
      // Send a POST request to the logout endpoint with CSRF token
      await axios.post('http://127.0.0.1:8000/api/logout/', {}, {
        headers: {
          'X-CSRFToken': getCookie('csrftoken'), // Include CSRF token in the headers
        },
      });
      handleLogout(); // Update the global authentication state
      navigate('/login'); // Redirect to the login page
    } catch (error) {
      console.error('Logout error:', error.response || error.message);
      alert('Failed to logout. Please try again.');
    }
  };

  // Utility function to retrieve the CSRF token from cookies
  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  // Fetch books from the backend
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

  // Search functionality
  const handleSearch = () => {
    if (!query.trim()) return;
    setPage(1); // Reset to page 1
    fetchBooks(query, 1, sortOption);
  };

  // Pagination controls
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

  // Sort menu controls
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
      <h1>Welcome to the Home Page</h1>
      <p>You are now logged in.</p>
      <button onClick={handleLogoutClick}>Logout</button>

      <div>
        <input
          type="text"
          placeholder="Search for books"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
      </div>

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
};

export default Home;
