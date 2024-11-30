import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Home';
import '../styles/Book-Details.css';

function BookDetails() {
  const [error, setError] = useState('');
  const [searchType, setSearchType] = useState('isbn')
  const [searchValue, setSearchValue] = useState('');
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const locationRouter = useLocation();
  const baseUrl = 'https://www.googleapis.com/books/v1/volumes?q=';
  const apiKey = '&key=AIzaSyAOo9-IH2Ox7xDLtPt58X-I7J6_174tA5s';

  //Get book data that was sent from home page
  useEffect(() => {
    if (locationRouter.state?.book) {
      setBook(locationRouter.state.book);
    }
  }, [locationRouter]);

  const getSearchPrefix = () => {
    switch(searchType) {
      case 'isbn':
        return 'isbn:';
      case 'title':
        return 'intitle:';
      case 'author':
        return 'inauthor:';
      default:
        return '';
    }
  };


  const searchBook = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const searchPrefix = getSearchPrefix();
      const response = await fetch(`${baseUrl}${searchPrefix}${searchValue}${apiKey}`);
      const data = await response.json();

      if (data.items && data.items.length > 0) {
        setBook(data.items[0].volumeInfo);
      } else {
        setError(`No books found with that ${searchType}.`);
      }
    } catch (err) {
      setError('Error grabbing book information');
      console.log(error);
    } finally {
      setLoading(false);
    }
  };


return (
    <div className="book-details-container">
      <p>Search for a book by ISBN, Title, or Author</p>

      <form onSubmit={searchBook} className="search-form">
        <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
        >
          <option value="isbn">ISBN</option>
          <option value="title">Title</option>
          <option value="author">Author</option>
        </select>

        <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={`Enter ${searchType}...`}
        />

        <input type="submit" value="Search" disabled={loading}/>
      </form>

      {error && <p className="error-message">{error}</p>}
      {loading && <p className="loading-message">Loading...</p>}

      {book && (
          <div className="book-details">
            <h2>Book Details</h2>
            <h3>{book.title}</h3>
            {book.image && (
                <img
                    src={book.image}
                    alt={book.title}
                    className="book-image"
                />
            )}
            <div className="book-info">
              {book.author && (
                  <p><strong>Authors:</strong> {book.author}</p>
              )}
              {book.year && (
                  <p><strong>Published Date:</strong> {book.year}</p>
              )}
              {book.description && (
                  <p><strong>Description:</strong> {book.description}</p>
              )}
              {book.pageCount && (
                  <p><strong>Pages:</strong> {book.pageCount}</p>
              )}
              {book.genre && (
                  <p><strong>Genres:</strong> {book.genre}</p>
              )}
            </div>
          </div>
      )}
    </div>
);
}

export default BookDetails;
