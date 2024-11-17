import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function BookDetails() {
  const [error, setError] = useState('');
  const [isbn, setIsbn] = useState('');
  const [book, setBook] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const baseUrl = 'https://www.googleapis.com/books/v1/volumes?q=isbn:';
  const apiKey = '&key=AIzaSyAOo9-IH2Ox7xDLtPt58X-I7J6_174tA5s'

  const searchBook = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
        const response = await fetch(baseUrl + isbn + apiKey);
        const data = await response.json();

        if (data.items && data.items.length > 0) {
            setBook(data.items[0].volumeInfo);
        }
        else setError('No books exist with that ISBN.');
    } catch (error) {
        setError('Error grabbing book information');
        console.log(error);
    } finally {
        setLoading(false);
    }
  };



    /*fetch(baseUrl.concat(isbn).concat(apiKey))
        .then((response) => response.data)
        .then((data) => {
            setBook(data);
            console.log(data);
        })
        .catch((error) => alert(error));
  }; */


  return (
      <div>
        <h2>Book Details</h2>
        <p>
          Find a book by ISBN.
        </p>
        <form onSubmit={searchBook}>
          <input
              type="text"
              id="isbn"
              placeholder="ISBN"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
          />
          <input type="submit" value="Submit" disabled={loading}/>
        </form>
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
                  <img src={book.imageLinks.thumbnail}
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
