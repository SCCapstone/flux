import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useContext } from 'react';
import { AuthContext } from '../AuthContext';
import Navigation from '../components/Navigation';
import './Home';
import '../styles/Book-Details.css';
import StarRating from '../components/StarRating';
import '../styles/Gamification.css';

function BookDetails() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const locationRouter = useLocation();
  
  const [book, setBook] = useState(null);
  const [rating, setRating] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  
  const [reviews, setReviews] = useState([]); 
  const [newReviewText, setNewReviewText] = useState('');
  const [bookStatus, setBookStatus] = useState('NOT_ADDED');
  
  // Gamification states
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success',
    points: 0
  });
  const [achievementPopup, setAchievementPopup] = useState({
    show: false,
    achievement: null
  });

  useEffect(() => {
    console.log("Location state in BookDetails:", locationRouter.state);
    if (locationRouter.state?.book) {
      setBook(locationRouter.state.book);
    } else {
      console.warn("Book data missing from state. Redirecting...");
      navigate("/");
    }
  }, [locationRouter, navigate]);

  useEffect(() => {
    if (book && book.id) {
      const fetchRatings = async () => {
        try {
          const response = await axios.get(`http://127.0.0.1:8000/api/books/${book.id}/ratings/`);
          setAverageRating(response.data.average_rating);
          setTotalRatings(response.data.total_ratings);
        } catch (error) {
          console.error("Error fetching ratings:", error);
          setAverageRating(0);
          setTotalRatings(0);
        }
      };

      const fetchReviews = async () => {
        try {
          const response = await axios.get(`http://127.0.0.1:8000/api/books/${book.id}/reviews/`);
          setReviews(response.data);
        } catch (error) {
          console.error("Error fetching reviews:", error);
          setReviews([]);
        }
      };
      
      const fetchBookStatus = async () => {
        if (!user?.token) return;
        
        try {
          const response = await axios.get(
            `http://127.0.0.1:8000/api/books/${book.id}/status/`,
            { headers: { Authorization: `Bearer ${user.token}` } }
          );
          setBookStatus(response.data.status);
        } catch (error) {
          console.error('Error fetching book status:', error);
          setBookStatus('NOT_ADDED');
        }
      };

      fetchRatings();
      fetchReviews();
      fetchBookStatus();
    }
  }, [book, user]);

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

      const ratingResponse = await axios.post(
        'http://127.0.0.1:8000/api/rate-book/',
        { 
          book_id: bookResponse.data.id, 
          rating: newRating 
        },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      setRating(newRating);
      
      // Show gamification notification if points were earned
      if (ratingResponse.data.gamification) {
        setNotification({
          show: true,
          message: 'Rating submitted!',
          type: 'success',
          points: ratingResponse.data.gamification.points_earned || 0
        });
        
        // If there's a new achievement
        if (ratingResponse.data.gamification.achievement) {
          setAchievementPopup({
            show: true,
            achievement: ratingResponse.data.gamification.achievement
          });
        }
        
        // Hide notification after 3 seconds
        setTimeout(() => {
          setNotification(prev => ({...prev, show: false}));
        }, 3000);
      }
      
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
        image: book.imageLinks?.thumbnail?.replace('zoom=1', 'zoom=0') || '',
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
      
      // Show gamification notification if points were earned
      if (response.data.gamification) {
        setNotification({
          show: true,
          message: 'Review submitted!',
          type: 'success',
          points: response.data.gamification.points_earned || 0
        });
        
        // If there's a new achievement
        if (response.data.gamification.achievement) {
          setAchievementPopup({
            show: true,
            achievement: response.data.gamification.achievement
          });
        }
        
        // Hide notification after 3 seconds
        setTimeout(() => {
          setNotification(prev => ({...prev, show: false}));
        }, 3000);
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      alert('Failed to submit review. Please try again.');
    }
  };
  
  // Handle updating book reading status
  const handleUpdateBookStatus = async (status) => {
    if (!user?.token || !book) return;
    
    try {
      const response = await axios.post(
        `http://127.0.0.1:8000/api/books/${book.id}/update-status/`,
        { status },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      
      setBookStatus(status);
      
      // Show gamification notification if points were earned
      if (status === 'FINISHED' && response.data.gamification) {
        setNotification({
          show: true,
          message: 'Book finished! Great job!',
          type: 'success',
          points: response.data.gamification.points_earned
        });
        
        // If there's a new achievement
        if (response.data.gamification.achievement) {
          setAchievementPopup({
            show: true,
            achievement: response.data.gamification.achievement
          });
        }
        
        // Hide notification after 3 seconds
        setTimeout(() => {
          setNotification(prev => ({...prev, show: false}));
        }, 3000);
      }
    } catch (error) {
      console.error('Error updating book status:', error);
    }
  };
  
  // Close achievement popup
  const closeAchievementPopup = () => {
    setAchievementPopup({
      show: false,
      achievement: null
    });
  };

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <p>Book details are not available. Please go back and select a book.</p>
          <button onClick={() => navigate("/")} className="btn btn-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Gamification Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 max-w-xs bg-white rounded-lg shadow-lg p-4 border-l-4 border-green-500 z-50 animate-fade-in">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{notification.message}</p>
              {notification.points > 0 && (
                <p className="text-sm text-gray-600 font-bold">+{notification.points} points earned!</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Achievement Popup */}
      {achievementPopup.show && achievementPopup.achievement && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-sm w-full">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
                {achievementPopup.achievement.badge_image ? (
                  <img 
                    src={achievementPopup.achievement.badge_image} 
                    alt={achievementPopup.achievement.name} 
                    className="w-16 h-16" 
                  />
                ) : (
                  <span className="text-4xl">🏆</span>
                )}
              </div>
              <h3 className="text-2xl font-bold text-center mb-2">Achievement Unlocked!</h3>
              <h4 className="text-xl font-semibold text-blue-600">{achievementPopup.achievement.name}</h4>
              <p className="text-gray-600 text-center my-2">{achievementPopup.achievement.description}</p>
              <div className="bg-blue-100 text-blue-800 font-bold py-1 px-3 rounded-full text-sm mt-2">
                +{achievementPopup.achievement.points} points
              </div>
              <button 
                onClick={closeAchievementPopup}
                className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Awesome!
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="book-details">
          <h2 className="text-2xl font-bold mb-4">{book.title}</h2>

          <div className="book-content">
            <div className="book-image-container">
              {book.image && <img src={book.image} alt={book.title} className="book-image" />}
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
              
              {/* Reading Status Controls - only show if user is logged in */}
              {user && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                  <h4 className="font-semibold mb-3">Update Reading Status:</h4>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleUpdateBookStatus('WILL_READ')}
                      className={`flex-1 py-2 rounded ${
                        bookStatus === 'WILL_READ' 
                          ? 'bg-gray-600 text-white' 
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      Want to Read
                    </button>
                    <button 
                      onClick={() => handleUpdateBookStatus('READING')}
                      className={`flex-1 py-2 rounded ${
                        bookStatus === 'READING' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-blue-100 hover:bg-blue-200'
                      }`}
                    >
                      Currently Reading
                    </button>
                    <button 
                      onClick={() => handleUpdateBookStatus('FINISHED')}
                      className={`flex-1 py-2 rounded ${
                        bookStatus === 'FINISHED' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-green-100 hover:bg-green-200'
                      }`}
                    >
                      Finished
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rating-section mt-8">
            <h3 className="text-xl font-semibold mb-4">Rate Book</h3>
            <StarRating totalStars={5} value={rating} onRatingChange={handleRatingSubmit} />
            <p className="mt-2">
              Average Rating: {averageRating || "No ratings yet"} ({totalRatings} ratings)
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
              <button onClick={handleReviewSubmit} className="submit-review-button">
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
