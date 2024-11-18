import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function BookDetails() {
  const [error, setError] = useState('');
  const [searchType, setSearchType] = useState('isbn')
  const [searchValue, setSearchValue] = useState('');
  const [book, setBook] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const baseUrl = 'https://www.googleapis.com/books/v1/volumes?q=';
  const apiKey = '&key=AIzaSyAOo9-IH2Ox7xDLtPt58X-I7J6_174tA5s';

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
    <div>
      <h2>Book Details</h2>
      <p>Search for a book by ISBN, Title, or Author</p>
      
      <form onSubmit={searchBook}>
        <select 
          value={searchType} 
          onChange={(e) => setSearchType(e.target.value)}
          style={{ marginRight: '10px' }}
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
          style={{ marginRight: '10px' }}
        />
        
        <input type="submit" value="Search" disabled={loading} />
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading && <p>Loading...</p>}

      {book && (
        <div>
          <h2>Book Details</h2>
          <h3>{book.title}</h3>
          {book.authors && (
            <p><strong>Authors:</strong> {book.authors.join(', ')}</p>
          )}
          {book.publishedDate && (
            <p><strong>Published Date:</strong> {book.publishedDate}</p>
          )}
          {book.description && (
            <p><strong>Description:</strong> {book.description}</p>
          )}
          {book.imageLinks && (
            <img 
              src={book.imageLinks.thumbnail}
              alt={book.title}
              style={{ maxWidth: '200px' }}
            />
          )}
          {book.pageCount && (
            <p><strong>Pages:</strong> {book.pageCount}</p>
          )}
          {book.categories && (
            <p><strong>Categories:</strong> {book.categories.join(', ')}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default BookDetails;
