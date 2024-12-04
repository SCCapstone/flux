import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useContext } from 'react';
import { AuthContext } from '../AuthContext';
import './Home';
import '../styles/Book-Details.css';
import StarRating from '../components/StarRating';

function BookDetails() {
  const { user } = useContext(AuthContext);
  const [error, setError] = useState('');
  const [searchType, setSearchType] = useState('isbn')
  const [searchValue, setSearchValue] = useState('');
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(false);
  

  const navigate = useNavigate();
  const locationRouter = useLocation();
  const baseUrl = 'https://www.googleapis.com/books/v1/volumes?q=';
  const apiKey = '&key=AIzaSyAOo9-IH2Ox7xDLtPt58X-I7J6_174tA5s';

  const [rating, setRating] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [reviews, setReviews] = useState([]); 
  const [newReviewText, setNewReviewText] = useState(''); 

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

  useEffect(() => {
    if (book && book.id) {
      const fetchRatings = async () => {
        try {
          const response = await axios.get(`http://127.0.0.1:8000/api/book/${book.id}/ratings/`);
          setAverageRating(response.data.average_rating);
          setTotalRatings(response.data.total_ratings);
        } catch (error) {
          if (error.response?.status === 404) {
            // Book doesn't exist in our database yet, set default values
            setAverageRating(0);
            setTotalRatings(0);
          } else {
            console.error('Error fetching ratings:', error);
          }
        }
      };
      const fetchReviews = async () => {
        try {
          const response = await axios.get(`http://127.0.0.1:8000/api/book/${book.id}/reviews/`);
          setReviews(response.data); 
        } catch (error) {
          console.error('Error fetching reviews:', error);
        }
      };
      fetchRatings();
      fetchReviews();
    }
  }, [book]);

  const handleRatingSubmit = async (newRating) => {
    if (!book || !book.id) {
      console.error('Book ID is missing. Cannot submit rating.');
      return;
    }

    try {
      // First, ensure the book exists in our database
      const bookData = {
        google_books_id: book.id,
        title: book.title,
        author: book.author,
        // Add other relevant book fields
      };

      // Create or get the book first
      const bookResponse = await axios.post(
        'http://127.0.0.1:8000/api/books/create-or-get/',
        bookData,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      // Then submit the rating using the database book ID
      const response = await axios.post(
        'http://127.0.0.1:8000/api/rate-book/',
        { 
          book_id: bookResponse.data.id, 
          rating: newRating 
        },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      console.log('Rating submitted successfully:', response.data);
      setRating(newRating);
    } catch (err) {
      console.error('Error submitting rating:', err.response?.data || err.message);
      alert('Failed to submit rating. Please try again.');
    }
  };
  const handleReviewSubmit = async () => {
    if (!newReviewText || !book) return;

    try {
      const response = await axios.post(
        'http://127.0.0.1:8000/api/reviews/',
        {
          review_text: newReviewText,
          book: book.id,
        },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setReviews([...reviews, response.data]); 
      setNewReviewText(''); 
      console.log('Review submitted successfully:', response.data);
    } catch (err) {
      console.error('Error submitting review:', err);
      alert('Failed to submit review. Please try again.');
    }
  };

  if (!book) {
    return (
      <div>
        <p>Book details are not available. Please go back and select a book.</p>
        <button onClick={() => navigate('/')}>Go Back</button>
      </div>
    );
  }

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
      <h3>Rate this Book</h3>
      <StarRating
        totalStars={5}
        value={rating}
        onRatingChange={(value) => handleRatingSubmit(value)}
      />
      <p>Average Rating: {averageRating || 'No ratings yet'} ({totalRatings} ratings)</p>

      <h3>Reviews</h3>
      <div className="reviews">
        {reviews.length === 0 ? (
          <p>No reviews yet.</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="review">
              <p><strong>{review.user.username}</strong>: {review.review_text}</p>
            </div>
          ))
        )}
      </div>

      <textarea
        value={newReviewText}
        onChange={(e) => setNewReviewText(e.target.value)}
        placeholder="Write a review"
      />
      <button onClick={handleReviewSubmit}>Submit Review</button>

      <button onClick={() => navigate('/')} className="back-button">
        Back to Home
      </button>
    </div>
  );
}

export default BookDetails;