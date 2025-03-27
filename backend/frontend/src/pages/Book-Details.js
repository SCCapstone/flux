import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { ThemeContext } from '../ThemeContext';
import Navigation from '../components/Navigation';
import './Home';
import '../styles/Book-Details.css';
import StarRating from '../components/StarRating';
import '../styles/Gamification.css';

function BookDetails() {
  const { user } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const locationRouter = useLocation();
  
  const [book, setBook] = useState(null);
  const [rating, setRating] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  
  const [reviews, setReviews] = useState([]); 
  const [newReviewText, setNewReviewText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [selectedReview, setSelectedReview] = useState(null);
  const [bookStatus, setBookStatus] = useState('NOT_ADDED');
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
  const statusDisplayMap = {
    WILL_READ: "Will Read",
    READING: "Currently Reading",
    FINISHED: "Finished Reading"
  };

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
    if (book && book.google_books_id) {
      const fetchRatings = async () => {
        try {
          const response = await axios.get(`${apiBaseUrl}/books/${book.google_books_id}/ratings/`);
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
          const response = await axios.get(`${apiBaseUrl}/books/${book.google_books_id}/reviews/`);
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
            `${apiBaseUrl}/books/${book.google_books_id}/status/`,
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
    console.log("newRating:", newRating);
    console.log("book:", book);

    if (!newRating || !book) {
      console.error('Book ID is missing. Cannot submit rating.');
      return;
    }

    try {
      const bookData = {
        google_books_id: book.google_books_id,
        title: book.title,
        author: book.authors ? book.authors.join(', ') : '',
        description: book.description,
        genre: book.categories ? book.categories.join(', ') : '',
        image: book.imageLinks?.thumbnail || '',
        year: book.publishedDate ? book.publishedDate.substring(0, 4) : ''
      };

      const bookResponse = await axios.post(
        `${apiBaseUrl}/books/create-or-get/`,
        bookData,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      const ratingResponse = await axios.post(
        `${apiBaseUrl}/rate-book/`,
        {
          google_books_id: bookResponse.data.google_books_id,
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
      const newRatingsResponse = await axios.get(`${apiBaseUrl}/books/${book.google_books_id}/ratings/`);
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
        google_books_id: book.google_books_id,
        title: book.title,
        author: book.authors ? book.authors.join(', ') : '',
        description: book.description,
        genre: book.categories ? book.categories.join(', ') : '',
        image: book.imageLinks?.thumbnail?.replace('zoom=1', 'zoom=0') || '',
        year: book.publishedDate ? book.publishedDate.substring(0, 4) : ''
      };
      const bookResponse = await axios.post(
        `${apiBaseUrl}/books/create-or-get/`,
        bookData,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      const response = await axios.post(
        `${apiBaseUrl}/reviews/`,
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

  const handleReviewDelete = async (reviewId) => {
    try {
      await axios.delete(
        `${apiBaseUrl}/reviews/${reviewId}/delete/`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      setReviews(reviews.filter(review => review.id !== reviewId));
    } catch (err) {
      console.error('Error deleting review:', err);
      alert('Failed to delete review. Please try again.');
    }
  };

  const handleReviewEdit = async (reviewId, newReviewText) => {
    if (!newReviewText) return;
  
    try {
      const response = await axios.put(
        `${apiBaseUrl}/reviews/${reviewId}/`,
        { review_text: newReviewText },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
  
      setReviews(reviews.map(review => 
        review.id === reviewId ? { ...review, review_text: response.data.review_text } : review
      ));
  
      setNewReviewText('');
    } catch (err) {
      console.error('Error editing review:', err);
      alert('Failed to edit review. Please try again.');
    }
  };

  const handleReplySubmit = async (reviewId) => {
    if (!replyText || !book) return;

    try {
      const response = await axios.post(
        `${apiBaseUrl}/reviews/${reviewId}/reply/`,
        {
          review_text: replyText,
          parent: reviewId,
        },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      setReviews((prevReviews) =>
        prevReviews.map((review) =>
          review.id === reviewId
            ? { ...review, replies: [...(review.replies || []), response.data] }
            : review
        )
      );
      setReplyText('');
      setSelectedReview(null);
    } catch (err) {
      console.error('Error submitting reply:', err);
      alert('Failed to submit reply. Please try again.');
    }
  };

  const handleReplyClick = (reviewId) => {
    setSelectedReview(reviewId);
  };

  // Handle updating book reading status
const handleUpdateBookStatus = async (status) => {
  if (!user?.token || !book) return;

  try {
    const response = await axios.post(
      `${apiBaseUrl}/books/${book.google_books_id}/update-status/`,
      { status },
      { headers: { Authorization: `Bearer ${user.token}` } }
    );

    setBookStatus(status);

    // If book is marked as FINISHED, update our custom localStorage tracker
    if (status === 'FINISHED') {
      try {
        // Get current finished books from localStorage
        let finishedBooks = [];
        const storedFinishedBooks = localStorage.getItem('fluxFinishedBooks');
        if (storedFinishedBooks) {
          finishedBooks = JSON.parse(storedFinishedBooks);
        }
        
        // Check if this book is already in the list
        const bookExists = finishedBooks.some(b => b.id === book.google_books_id);
        
        // If not, add it
        if (!bookExists) {
          finishedBooks.push({
            id: book.google_books_id,
            title: book.title,
            author: book.authors ? book.authors.join(', ') : '',
            date_finished: new Date().toISOString()
          });
          
          // Save back to localStorage
          localStorage.setItem('fluxFinishedBooks', JSON.stringify(finishedBooks));
          console.log('Added book to finished books:', book.title);
          
          // Dispatch a custom event for other components
          window.dispatchEvent(new CustomEvent('finishedBookAdded', { 
            detail: { book: book.google_books_id } 
          }));
          
          // Also update any active challenges directly
          try {
            const storedChallenges = localStorage.getItem('userChallenges');
            if (storedChallenges) {
              const challenges = JSON.parse(storedChallenges);
              if (challenges && challenges.length > 0) {
                // Update each challenge's progress
                const updatedChallenges = challenges.map(challenge => {
                  // Calculate new book count and progress
                  const booksRead = (challenge.books_read || 0) + 1;
                  const progress_percentage = Math.min(
                    Math.round((booksRead / challenge.target_books) * 100),
                    100
                  );
                  
                  // Add this book to the challenge's read books
                  const readBooks = challenge.readBooks || [];
                  if (!readBooks.includes(book.google_books_id)) {
                    readBooks.push(book.google_books_id);
                  }
                  
                  // Return updated challenge
                  return {
                    ...challenge,
                    books_read: booksRead,
                    progress_percentage,
                    readBooks
                  };
                });
                
                // Save back to localStorage
                localStorage.setItem('userChallenges', JSON.stringify(updatedChallenges));
                console.log('Updated challenges progress for new finished book');
              }
            }
          } catch (e) {
            console.error('Error updating challenges in localStorage:', e);
          }
        }
      } catch (e) {
        console.error('Error updating finished books in localStorage:', e);
      }
    }

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
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Navigation />

      {/* Gamification Notification */}
      {notification.show && (
        <div className={`fixed top-20 right-4 max-w-xs ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-4 border-l-4 border-green-500 z-50 animate-fade-in`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>{notification.message}</p>
              {notification.points > 0 && (
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-bold`}>+{notification.points} points earned!</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Achievement Popup */}
      {achievementPopup.show && achievementPopup.achievement && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className={`bg-white ${theme === 'dark' ? 'bg-gray-800' : ''} rounded-lg shadow-xl p-6 m-4 max-w-sm w-full`}>
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
              <h3 className={`text-2xl font-bold text-center mb-2 ${theme === 'dark' ? 'text-gray-300' : ''}`}>Achievement Unlocked!</h3>
              <h4 className={`text-xl font-semibold text-blue-600 ${theme === 'dark' ? 'text-gray-400' : ''}`}>{achievementPopup.achievement.name}</h4>
              <p className={`text-gray-600 ${theme === 'dark' ? 'text-gray-400' : ''} text-center my-2`}>{achievementPopup.achievement.description}</p>
              <div className={`bg-blue-100 ${theme === 'dark' ? 'bg-gray-700' : ''} text-blue-800 ${theme === 'dark' ? 'text-gray-400' : ''} font-bold py-1 px-3 rounded-full text-sm mt-2`}>
                +{achievementPopup.achievement.points} points
              </div>
              <button
                onClick={closeAchievementPopup}
                className={`mt-6 ${theme === 'dark' ? 'bg-gray-600' : 'bg-blue-600'} hover:${theme === 'dark' ? 'bg-gray-700' : 'bg-blue-700'} text-white font-bold py-2 px-4 rounded`}
              >
                Awesome!
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`max-w-7xl mx-auto px-4 py-6 ${theme === 'dark' ? 'text-gray-300' : ''}`}>
        <div className={`book-details-container ${theme === 'dark' ? 'dark-container' : ''}`}>
          <div className={`book-details ${theme === 'dark' ? 'dark-book-details' : ''}`}>
            <h1 className={`text-2xl ${theme === 'dark' ? 'dark-text' : ''}`}>{book.title}</h1>
            <div className="book-content">
              <div className="book-image-container">
                {book.image && <img src={book.image} alt={book.title} className="book-image" />}
              </div>
              <div className={`book-info ${theme === 'dark' ? 'dark-book-info' : ''}`}>
                {book.author && (
                  <p><strong className={theme === 'dark' ? 'dark-strong' : ''}>Author:</strong> <span className={theme === 'dark' ? 'dark-text' : ''}>{book.author}</span></p>
                )}
                {book.year && (
                  <p><strong className={theme === 'dark' ? 'dark-strong' : ''}>Published Date:</strong> <span className={theme === 'dark' ? 'dark-text' : ''}>{book.year}</span></p>
                )}
                {book.description && (
                  <p><strong className={theme === 'dark' ? 'dark-strong' : ''}>Description:</strong> <span className={theme === 'dark' ? 'dark-text' : ''}>{book.description}</span></p>
                )}
                {book.pageCount && (
                  <p><strong className={theme === 'dark' ? 'dark-strong' : ''}>Pages:</strong> <span className={theme === 'dark' ? 'dark-text' : ''}>{book.pageCount}</span></p>
                )}
                {book.genre && (
                  <p><strong className={theme === 'dark' ? 'dark-strong' : ''}>Genres:</strong> <span className={theme === 'dark' ? 'dark-text' : ''}>{book.genre}</span></p>
                )}

                {/* Reading Status Controls - only show if user is logged in */}
                {user && (
                  <div className={`mt-4 p-4 rounded-lg border ${theme === 'dark' ? 'dark-status-container' : ''}`}>
                    <h4 className={`font-semibold mb-3 ${theme === 'dark' ? 'dark-text' : ''}`}>Update Reading Status: </h4>
                    <h4 className={`font-semibold mb-3 ${theme === 'dark' ? 'dark-text' : ''}`}>Currently: {statusDisplayMap[bookStatus] || "Book not added"}</h4>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUpdateBookStatus('WILL_READ')}
                        className={`flex-1 py-2 rounded ${
                          bookStatus === 'WILL_READ'
                            ? theme === 'dark' ? 'dark-button-active' : 'bg-gray-600 text-white'
                            : theme === 'dark' ? 'dark-button' : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                      >
                        Want to Read
                      </button>
                      <button
                        onClick={() => handleUpdateBookStatus('READING')}
                        className={`flex-1 py-2 rounded ${
                          bookStatus === 'READING'
                            ? theme === 'dark' ? 'dark-button-blue-active' : 'bg-blue-600 text-white'
                            : theme === 'dark' ? 'dark-button-blue' : 'bg-blue-100 hover:bg-blue-200'
                        }`}
                      >
                        Currently Reading
                      </button>
                      <button
                        onClick={() => handleUpdateBookStatus('FINISHED')}
                        className={`flex-1 py-2 rounded ${
                          bookStatus === 'FINISHED'
                            ? theme === 'dark' ? 'dark-button-green-active' : 'bg-green-600 text-white'
                            : theme === 'dark' ? 'dark-button-green' : 'bg-green-100 hover:bg-green-200'
                        }`}
                      >
                        Finished
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className={`rating-section mt-8 ${theme === 'dark' ? 'dark-section' : ''}`}>
            <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'dark-heading' : ''}`}>Rate Book</h3>
              <StarRating totalStars={5} value={rating} onRatingChange={handleRatingSubmit} />
              <p className={`mt-2 ${theme === 'dark' ? 'dark-text' : ''}`}>
                Average Rating: {averageRating || "No ratings yet"} ({totalRatings} ratings)
              </p>
            </div>

            <div className={`reviews-section mt-8 ${theme === 'dark' ? 'dark-section' : ''}`}>
              <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'dark-heading' : ''}`}>Reviews</h3>
              <div className="reviews-list">
                {reviews.length === 0 ? (
                  <p className={theme === 'dark' ? 'dark-text' : ''}>No reviews yet.</p>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className={`review-item ${theme === 'dark' ? 'dark-review-item' : ''}`}>
                      <p><strong className={theme === 'dark' ? 'dark-strong' : ''}>{review.user.username}</strong>: <span className={theme === 'dark' ? 'dark-text' : ''}>{review.review_text}</span></p>
                      {review.user.id === user.id && (
                        <div className="review-actions">
                          <button 
                            onClick={() => handleReviewEdit(review.id, review.review_text)}
                            className={`edit-button ${theme === 'dark' ? 'dark-edit-button' : ''}`}
                          >
                            Edit
                          </button>
              
                          <button 
                            onClick={() => handleReviewDelete(review.id)} 
                            className={`delete-button ${theme === 'dark' ? 'dark-delete-button' : ''}`}
                          >
                            Delete
                          </button>
                        </div>
                      )}

                      <button 
                        onClick={() => handleReplyClick(review.id)} 
                        className={`reply-button ${theme === 'dark' ? 'dark-reply-button' : ''}`}
                      >
                        Reply
                      </button>

                      {selectedReview === review.id && (
                        <div className={`reply-form ${theme === 'dark' ? 'dark-reply-form' : ''}`}>
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write a reply"
                            className={`reply-textarea ${theme === 'dark' ? 'dark-reply-textarea' : ''}`}
                          />
                          <button 
                            onClick={() => handleReplySubmit(review.id)}
                            className={`submit-reply-button ${theme === 'dark' ? 'dark-submit-reply-button' : ''}`}
                          >
                            Submit Reply
                          </button>
                        </div>
                      )}
                      {review.replies && review.replies.length > 0 && (
                        <div className={`replies ${theme === 'dark' ? 'dark-replies' : ''}`}>
                          {review.replies.map((reply) => (
                            <div key={reply.id} className={`reply-item ${theme === 'dark' ? 'dark-reply-item' : ''}`}>
                              <p><strong className={theme === 'dark' ? 'dark-strong' : ''}>{reply.user.username}</strong>: <span className={theme === 'dark' ? 'dark-text' : ''}>{reply.review_text}</span></p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className={`add-review mt-4 ${theme === 'dark' ? 'dark-add-review' : ''}`}>
                <textarea
                  value={newReviewText}
                  onChange={(e) => setNewReviewText(e.target.value)}
                  placeholder="Write a review"
                  className={`review-textarea ${theme === 'dark' ? 'dark-review-textarea' : ''}`}
                />
                <button onClick={handleReviewSubmit} className={`submit-review-button ${theme === 'dark' ? 'dark-submit-review-button' : ''}`}>
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookDetails;