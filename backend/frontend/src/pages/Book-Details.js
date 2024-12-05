import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useContext } from 'react';
import { AuthContext } from '../AuthContext';
import Navigation from '../components/Navigation';
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
          const response = await axios.get(`http://127.0.0.1:8000/api/books/${book.id}/ratings/`);
          setAverageRating(response.data.average_rating);
          setTotalRatings(response.data.total_ratings);
        } catch (error) {
          console.error('Error fetching ratings:', error);
          setAverageRating(0);
          setTotalRatings(0);
        }
      };

      const fetchReviews = async () => {
        try {
          const response = await axios.get(`http://127.0.0.1:8000/api/books/${book.id}/reviews/`);
          setReviews(response.data);
        } catch (error) {
          console.error('Error fetching reviews:', error);
          setReviews([]);
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
      const bookData = {
        google_books_id: book.id,
        title: book.title,
        author: book.authors ? book.authors.join(', ') : '',
        description: book.description,
        genre: book.categories ? book.categories.join(', ') : '',
        image: book.imageLinks?.thumbnail || '',
        year: book.publishedDate ? book.publishedDate.substring(0, 4) : ''
      };

      const bookResponse = await axios.post(
        'http://127.0.0.1:8000/api/books/create-or-get/',
        bookData,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      await axios.post(
        'http://127.0.0.1:8000/api/rate-book/',
        { 
          book_id: bookResponse.data.id, 
          rating: newRating 
        },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      setRating(newRating);
      
      // Refresh ratings
      const newRatingsResponse = await axios.get(`http://127.0.0.1:8000/api/books/${book.id}/ratings/`);
      setAverageRating(newRatingsResponse.data.average_rating);
      setTotalRatings(newRatingsResponse.data.total_ratings);
    } catch (err) {
      console.error('Error submitting rating:', err.response?.data || err.message);
      alert('Failed to submit rating. Please try again.');
    }
  };

  const handleReviewSubmit = async () => {
    if (!newReviewText || !book) return;

    try {
      const bookData = {
        google_books_id: book.id,
        title: book.title,
        author: book.authors ? book.authors.join(', ') : '',
        description: book.description,
        genre: book.categories ? book.categories.join(', ') : '',
        image: book.imageLinks?.thumbnail || '',
        year: book.publishedDate ? book.publishedDate.substring(0, 4) : ''
      };

      const bookResponse = await axios.post(
        'http://127.0.0.1:8000/api/books/create-or-get/',
        bookData,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      const response = await axios.post(
        'http://127.0.0.1:8000/api/reviews/',
        {
          review_text: newReviewText,
          book: bookResponse.data.id,
        },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      setReviews([...reviews, response.data]);
      setNewReviewText('');
    } catch (err) {
      console.error('Error submitting review:', err);
      alert('Failed to submit review. Please try again.');
    }
  };

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <p>Book details are not available. Please go back and select a book.</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-8">
          <form onSubmit={searchBook} className="search-form">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="select-input"
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
              className="search-input"
            />

            <button type="submit" className="search-button" disabled={loading}>
              Search
            </button>
          </form>
        </div>

        {error && <p className="error-message">{error}</p>}
        {loading && <p className="loading-message">Loading...</p>}

        <div className="book-details">
          <h2 className="text-2xl font-bold mb-4">{book.title}</h2>
          
          <div className="book-content">
            <div className="book-image-container">
              {book.image && (
                <img
                  src={book.image}
                  alt={book.title}
                  className="book-image"
                />
              )}
            </div>
            
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

          <div className="rating-section mt-8">
            <h3 className="text-xl font-semibold mb-4">Rate Book</h3>
            <StarRating
              totalStars={5}
              value={rating}
              onRatingChange={(value) => handleRatingSubmit(value)}
            />
            <p className="mt-2">
              Average Rating: {averageRating || 'No ratings yet'} ({totalRatings} ratings)
            </p>
          </div>

          <div className="reviews-section mt-8">
            <h3 className="text-xl font-semibold mb-4">Reviews</h3>
            <div className="reviews-list">
              {reviews.length === 0 ? (
                <p>No reviews yet.</p>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="review-item">
                    <p><strong>{review.user.username}</strong>: {review.review_text}</p>
                  </div>
                ))
              )}
            </div>

            <div className="add-review mt-4">
              <textarea
                value={newReviewText}
                onChange={(e) => setNewReviewText(e.target.value)}
                placeholder="Write a review"
                className="review-textarea"
              />
              <button 
                onClick={handleReviewSubmit}
                className="submit-review-button"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookDetails;