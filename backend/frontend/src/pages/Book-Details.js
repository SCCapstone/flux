import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
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
  const params = useParams(); // Add this to access URL parameters
  
  const [book, setBook] = useState(null);
  const [rating, setRating] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  
  const [reviews, setReviews] = useState([]); 
  const [newReviewText, setNewReviewText] = useState('');
  const [selectedReview, setSelectedReview] = useState(null);
  const [bookStatus, setBookStatus] = useState('NOT_ADDED');
  const [isLoading, setIsLoading] = useState(true);
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
  
  // Utility function to handle different gamification data formats
  const handleGamificationData = (data) => {
    if (!data) return;
    
    // New format has gamification.notification structure
    if (data.notification) {
      const notificationData = data.notification;
      setNotification({
        show: notificationData.show,
        message: notificationData.message,
        type: notificationData.type || 'success',
        points: notificationData.points || 0
      });
      
      // Hide notification after 3 seconds
      setTimeout(() => {
        setNotification(prev => ({...prev, show: false}));
      }, 3000);
    } 
    // Old format just had points_earned directly
    else if (data.points_earned) {
      setNotification({
        show: true,
        message: 'Action completed!',
        type: 'success',
        points: data.points_earned
      });
      
      // Hide notification after 3 seconds
      setTimeout(() => {
        setNotification(prev => ({...prev, show: false}));
      }, 3000);
    }
    
    // Handle achievements
    // New format has an array of achievements
    if (data.achievements && data.achievements.length > 0) {
      setAchievementPopup({
        show: true,
        achievement: data.achievements[0] // Show first achievement if multiple
      });
    } 
    // Old format had a single achievement object
    else if (data.achievement) {
      setAchievementPopup({
        show: true,
        achievement: data.achievement
      });
    }
  };

  // Modified to handle both state and URL parameter cases
  useEffect(() => {
    const fetchBookData = async (bookId) => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${apiBaseUrl}/books/${bookId}/`);
        setBook(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching book details:", error);
        setIsLoading(false);
      }
    };

    console.log("Location state in BookDetails:", locationRouter.state);
    if (locationRouter.state?.book) {
      // If we have the book in state, use it
      setBook(locationRouter.state.book);
      setIsLoading(false);
    } else if (params.bookId) {
      // If we have a book ID in the URL, fetch the book data
      console.log("Fetching book data for ID:", params.bookId);
      fetchBookData(params.bookId);
    } else {
      // No book data and no book ID, redirect
      console.warn("Book data missing and no ID in URL. Redirecting...");
      setIsLoading(false);
      navigate("/");
    }
  }, [locationRouter, navigate, params, apiBaseUrl]);


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
      
      fetchRatings();
    }
  }, [book, apiBaseUrl]);

  // Helper function to normalize review data structure
  const normalizeReview = (review) => {
    return {
      id: review.id || review.review_id,
      review_text: review.review_text || review.text || review.content || "",
      user: {
        id: review.user?.id || review.user_id || review.author_id,
        username: review.user?.username || review.username || review.author_name || "Unknown User"
      },
      updated_at: review.updated_at || review.date_updated || review.date || new Date().toISOString(),
      created_at: review.created_at || review.date_created || review.date || new Date().toISOString(),
      replies: Array.isArray(review.replies) 
        ? review.replies.map(normalizeReview) 
        : []
    };
  };

  useEffect(() => {
    if (book && book.google_books_id) {
      const fetchReviews = async () => {
        try {
          console.log(`Fetching reviews for book: ${book.title} (ID: ${book.google_books_id})`);
          const response = await axios.get(`${apiBaseUrl}/books/${book.google_books_id}/reviews/`);
          console.log("Reviews API raw response:", response);
          console.log("Reviews data:", response.data);
          
          let normalizedReviews = [];
          
          // Check if response data is an array
          if (Array.isArray(response.data)) {
            normalizedReviews = response.data.map(normalizeReview);
            console.log(`Set ${response.data.length} reviews in state`);
          } else if (response.data.results && Array.isArray(response.data.results)) {
            // Some APIs nest data in a results field
            normalizedReviews = response.data.results.map(normalizeReview);
            console.log(`Set ${response.data.results.length} reviews from results field`);
          } else {
            console.error("Unexpected review data format:", response.data);
            normalizedReviews = [];
          }
          
          console.log("Normalized reviews:", normalizedReviews);
          setReviews(normalizedReviews);
        } catch (error) {
          console.error("Error fetching reviews:", error);
          setReviews([]);
        }
      };
  
      fetchReviews();
    } else {
      console.log("No book ID available yet, can't fetch reviews");
    }
  }, [book, apiBaseUrl]);


  useEffect(() => {
    if (book && book.google_books_id && user?.token) {
      const fetchBookStatus = async () => {
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

      fetchBookStatus();
    }
  }, [book, user, apiBaseUrl]);

  const handleRatingSubmit = async (newRating) => {
    console.log("newRating:", newRating);
    console.log("book:", book);

    if (!newRating || !book) {
      console.error('Book ID is missing. Cannot submit rating.');
      return;
    }
    
    if (!user?.token) {
      alert('Please log in to rate books.');
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
        handleGamificationData(ratingResponse.data.gamification);
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
    
    if (!user?.token) {
      alert('Please log in to submit reviews.');
      return;
    }

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

      // Normalize the new review
      const normalizedNewReview = normalizeReview({
        ...response.data,
        user: {
          id: user.id,
          username: user.username
        },
        replies: []
      });

      setReviews([...reviews, normalizedNewReview]);
      setNewReviewText('');

      // Show gamification notification if points were earned
      if (response.data.gamification) {
        handleGamificationData(response.data.gamification);
      }
    } catch (err) {
      console.error('Error submitting review:', err);

      if (book && book.google_books_id) {
        try {
          console.log('Attempting to refresh reviews after error...');
          const refreshResponse = await axios.get(`${apiBaseUrl}/books/${book.google_books_id}/reviews/`);
          let refreshedReviews = [];
          
          if (Array.isArray(refreshResponse.data)) {
            refreshedReviews = refreshResponse.data.map(normalizeReview);
          } else if (refreshResponse.data.results && Array.isArray(refreshResponse.data.results)) {
            refreshedReviews = refreshResponse.data.results.map(normalizeReview);
          }
          
          if (refreshedReviews.length > reviews.length) {
            setReviews(refreshedReviews);
            setNewReviewText(''); // Clear the text area since the review was saved
            console.log('Review was likely saved successfully despite the error');
            
            // Show a success notification instead
            setNotification({
              show: true,
              message: 'Review submitted successfully!',
              type: 'success',
              points: 5 // Default points for a review
            });
            
            // Hide notification after 3 seconds
            setTimeout(() => {
              setNotification(prev => ({...prev, show: false}));
            }, 3000);
            
            return; // Exit early, don't show the alert
          }
        } catch (refreshErr) {
          console.error('Error refreshing reviews after submission error:', refreshErr);
        }
      }
      
      // Only show alert if the above retry approach didn't work
      alert('Failed to submit review. Please try again.');
    }
  };

  const handleReviewDelete = async (reviewId) => {
    if (!user?.token) return;
    
    try {
      await axios.delete(
        `${apiBaseUrl}/reviews/${reviewId}/delete/`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      const filterDeletedReview = (reviewsList) => {
        return reviewsList.filter(review => {
          if (review.id === reviewId) {
            return false;
          }
          if (review.replies && review.replies.length > 0) {
            review.replies = filterDeletedReview(review.replies);
          }
          return true;
        });
      };

      setReviews(filterDeletedReview([...reviews]));
    } catch (err) {
      console.error('Error deleting review:', err);
      alert('Failed to delete review. Please try again.');
    }
  };

  const handleReviewEdit = async (reviewId, updatedText) => {
    if (!updatedText || !user?.token) return;
  
    try {
      const response = await axios.put(
        `${apiBaseUrl}/reviews/${reviewId}/`,
        { review_text: updatedText },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
  
      // Use a recursive function to update the review text wherever it exists in the tree
      const updateReviewText = (reviewsList) => {
        return reviewsList.map(review => {
          if (review.id === reviewId) {
            return normalizeReview({
              ...review,
              review_text: updatedText,
              updated_at: response.data.updated_at || new Date().toISOString()
            });
          } else if (review.replies && review.replies.length > 0) {
            return {
              ...review,
              replies: updateReviewText(review.replies)
            };
          }
          return review;
        });
      };
  
      setReviews(updateReviewText([...reviews]));
    } catch (err) {
      console.error('Error editing review:', err);
      alert('Failed to edit review. Please try again.');
    }
  };

  const handleReplySubmit = async (reviewId, replyText) => {
    if (!replyText.trim() || !book || !user?.token) return;
  
    try {
      const response = await axios.post(
        `${apiBaseUrl}/reviews/${reviewId}/reply/`,
        {
          review_text: replyText,
          parent: reviewId,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
  
      // Normalize the new reply
      const normalizedReply = normalizeReview({
        ...response.data,
        user: {
          id: user.id,
          username: user.username
        },
        replies: []
      });
      
      // Recursive helper to insert the reply in the correct review thread
      const addReplyToTree = (reviews) => {
        return reviews.map((review) => {
          if (review.id === reviewId) {
            return {
              ...review,
              replies: [...(review.replies || []), normalizedReply],
            };
          } else if (review.replies && review.replies.length > 0) {
            return {
              ...review,
              replies: addReplyToTree(review.replies),
            };
          }
          return review;
        });
      };
  
      // Update the state with new reply
      setReviews((prevReviews) => addReplyToTree(prevReviews));
      
      // Show gamification notification if points were earned
      if (response.data.gamification) {
        handleGamificationData(response.data.gamification);
      }
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
      if (response.data.gamification) {
        handleGamificationData(response.data.gamification);
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

  const ReviewItem = ({ review, depth = 0 }) => {
    // Each review item manages its own reply state
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState("");
    // Add state for editing
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(review.review_text || "");
  
    const handleLocalReplySubmit = () => {
      if (!replyText.trim()) return;
  
      handleReplySubmit(review.id, replyText);
      setReplyText("");
      setIsReplying(false);
    };
    
    // Handler for edit submit
    const handleLocalEditSubmit = () => {
      if (!editText.trim()) return;
      
      handleReviewEdit(review.id, editText);
      setIsEditing(false);
    };
    
    const isUserReview = user && review.user && 
      (user.id === review.user.id || 
       (user.username && review.user.username && user.username === review.user.username));
  
    return (
      <div 
        className={`review-item ${theme === 'dark' ? 'dark-review-item' : ''}`} 
        style={{ marginLeft: `${depth * 20}px` }}
      >
        {!isEditing ? (
          // Normal view
          <>
            <p>
              <strong className={theme === 'dark' ? 'dark-strong' : ''}>
                {review.user?.username || 'Unknown User'}
              </strong>: 
              <span className={theme === 'dark' ? 'dark-text' : ''}>
                {review.review_text}
              </span>
            </p>
      
            {/* Only show edit/delete buttons if this is the user's review */}
            {isUserReview && (
              <div className="review-actions">
                <button 
                  onClick={() => setIsEditing(true)} 
                  className={`edit-button ${theme === 'dark' ? 'dark-edit-button' : ''}`}
                  style={{ width: '65px', maxWidth: '65px' }}
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleReviewDelete(review.id)} 
                  className={`delete-button ${theme === 'dark' ? 'dark-delete-button' : ''}`}
                  style={{ width: '65px', maxWidth: '65px' }}
                >
                  Delete
                </button>
              </div>
            )}
          </>
        ) : (
          // Edit view
          <div className={`edit-form ${theme === 'dark' ? 'dark-edit-form' : ''}`}>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className={`edit-textarea ${theme === 'dark' ? 'dark-edit-textarea' : ''}`}
            />
            <div className="edit-actions">
              <button 
                onClick={handleLocalEditSubmit} 
                className={`save-button ${theme === 'dark' ? 'dark-save-button' : ''}`}
              >
                Save
              </button>
              <button 
                onClick={() => setIsEditing(false)} 
                className={`cancel-button ${theme === 'dark' ? 'dark-cancel-button' : ''}`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
  
        {/* Toggle Reply Form */}
        <button 
          onClick={() => setIsReplying(!isReplying)} 
          className={`reply-button ${theme === 'dark' ? 'dark-reply-button' : ''}`}
          style={{ width: '65px', maxWidth: '65px' }}
        >
          {isReplying ? "Cancel" : "Reply"}
        </button>
  
        {isReplying && (
          <div className={`reply-form ${theme === 'dark' ? 'dark-reply-form' : ''}`}>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a Reply"
              className={`reply-textarea ${theme === 'dark' ? 'dark-reply-textarea' : ''}`}
            />
            <button onClick={handleLocalReplySubmit} className={`submit-reply-button ${theme === 'dark' ? 'dark-submit-reply-button' : ''}`}>
              Submit Reply
            </button>
          </div>
        )}
  
        {/* Render Replies */}
        {review.replies && review.replies.length > 0 && (
          <div className={`replies ${theme === 'dark' ? 'dark-replies' : ''}`}>
            {review.replies.map((reply) => (
              <ReviewItem
                key={reply.id}
                review={reply}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <p className={theme === 'dark' ? 'text-gray-300' : ''}>Loading book details...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <p className={theme === 'dark' ? 'text-gray-300' : ''}>Book details are not available. Please go back and select a book.</p>
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
        <div className="toast-notification">
          <div className={theme === 'dark' ? 'toast-content-dark' : 'toast-content'}>
            <div className="flex-1">
              <div className="flex items-center">
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium">{notification.message}</p>
              </div>
              {notification.points > 0 && (
                <div className={theme === 'dark' ? 'points-badge-dark' : 'points-badge'}>
                  <span className="points-icon">⭐</span>
                  <span>+{notification.points} points</span>
                </div>
              )}
            </div>
            <button 
              onClick={() => setNotification(prev => ({...prev, show: false}))}
              className={`ml-2 ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
              aria-label="Close notification"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Achievement Popup */}
      {achievementPopup.show && achievementPopup.achievement && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-60">
          <div 
            className={`rounded-lg transform transition-all ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'}`}
            style={{
              animation: 'scale-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', 
              width: '300px', 
              maxWidth: '300px', 
              padding: '16px',
              border: theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb',
              boxShadow: theme === 'dark' ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div className="relative">
              {/* Close button */}
              <button
                onClick={closeAchievementPopup}
                className={`absolute top-2 right-2 rounded-full p-1 ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
                style={{ fontSize: '0.75rem' }}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="flex flex-col items-center">
                <div className="mb-3 mt-1">
                  {achievementPopup.achievement.badge_image ? (
                    <img
                      src={achievementPopup.achievement.badge_image}
                      alt={achievementPopup.achievement.name}
                      className="w-12 h-12 mx-auto"
                    />
                  ) : (
                    <div className="text-center text-lg font-semibold mt-2 mb-1">
                      Achievement Unlocked
                    </div>
                  )}
                </div>
                
                <div className="w-full text-center">
                  <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{achievementPopup.achievement.name}</h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-3`}>{achievementPopup.achievement.description}</p>
                  
                  <div className="mb-4">
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {achievementPopup.achievement.points} points added to your account
                    </p>
                  </div>
                  
                  <button
                    onClick={closeAchievementPopup}
                    className={`w-full py-2 px-4 rounded text-sm font-medium transition-all duration-200 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
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
                      <ReviewItem key={review.id} review={review} />
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