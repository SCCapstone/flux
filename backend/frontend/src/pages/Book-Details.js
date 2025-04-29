import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    WANT_TO_READ: "Want to Read",
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

  // Modified to handle various ways to navigate to book details
  useEffect(() => {
    const fetchBookData = async (bookId) => {
      try {
        setIsLoading(true);
        console.log(`Fetching complete book data from Google Books API for ID: ${bookId}`);
        // Use the Google Books API directly to fetch book details
        const response = await axios.get(`https://www.googleapis.com/books/v1/volumes/${bookId}`);
        console.log('Book data fetched successfully from Google Books API:', response.data);
        
        // Process the Google Books API response to match the expected format
        const volumeInfo = response.data.volumeInfo || {};
        const processedBook = {
          id: response.data.id,
          google_books_id: response.data.id,
          title: volumeInfo.title || 'Unknown Title',
          author: (volumeInfo.authors && volumeInfo.authors.length > 0) ? volumeInfo.authors.join(', ') : 'Unknown Author',
          description: volumeInfo.description || '',
          image: volumeInfo.imageLinks?.thumbnail || '',
          genre: (volumeInfo.categories && volumeInfo.categories.length > 0) ? volumeInfo.categories.join(', ') : '',
          year: volumeInfo.publishedDate ? volumeInfo.publishedDate.substring(0, 4) : '',
        };
        
        console.log('Processed book data:', processedBook);
        setBook(processedBook);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching book details:", error);
        setIsLoading(false);
      }
    };

    // Get query parameters from URL
    const queryParams = new URLSearchParams(locationRouter.search);
    const queryBookId = queryParams.get('id');
    
    console.log("Location state in BookDetails:", locationRouter.state);
    console.log("URL query parameters in BookDetails:", { id: queryBookId });
    console.log("URL path parameters in BookDetails:", params);
    
    if (queryBookId) {
      console.log("Found book ID in query params, fetching full details");
      fetchBookData(queryBookId);
    }
    else if (params.bookId) {
      console.log("Found book ID in URL path params, fetching full details");
      fetchBookData(params.bookId);
    }
    else if (locationRouter.state?.book) {
      const receivedBook = locationRouter.state.book;
      console.log("Book from state:", receivedBook);
      
      if (receivedBook.google_books_id && (!receivedBook.description || !receivedBook.genre || !receivedBook.year)) {
        console.log("Book is missing fields, fetching complete data");
        fetchBookData(receivedBook.google_books_id);
      } else {
        console.log("Using complete book data from state");
        setBook(receivedBook);
        setIsLoading(false);
      }
    } 
    else {
      console.error("No book ID or state data available");
      setIsLoading(false);
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
  const handleUpdateBookStatus = async (newStatus) => { 
    if (!user?.token || !book) return;

    const previousStatus = bookStatus; 

    try {
      const response = await axios.post(
        `${apiBaseUrl}/books/${book.google_books_id}/update-status/`,
        { status: newStatus }, 
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      setBookStatus(newStatus); 

      // Only run finished book logic if status changes TO FINISHED from something else
      if (newStatus === 'FINISHED' && previousStatus !== 'FINISHED') {
        
        let awardedPointsBooks = [];
        try {
          const storedAwarded = localStorage.getItem('fluxFinishedPointsAwarded');
          if (storedAwarded) {
            awardedPointsBooks = JSON.parse(storedAwarded);
          }
        } catch (e) {
          console.error('Error reading awarded points books from localStorage:', e);
          awardedPointsBooks = [];
        }

        const alreadyAwarded = awardedPointsBooks.includes(book.google_books_id);

        // Only proceed if points haven't been awarded for this book yet
        if (!alreadyAwarded) {
          try {
            let finishedBooks = [];
            const storedFinishedBooks = localStorage.getItem('fluxFinishedBooks');
            if (storedFinishedBooks) {
              finishedBooks = JSON.parse(storedFinishedBooks);
            }
            const bookExists = finishedBooks.some(b => b.id === book.google_books_id);
            if (!bookExists) {
              finishedBooks.push({
                id: book.google_books_id,
                title: book.title,
                author: book.authors ? book.authors.join(', ') : '',
                date_finished: new Date().toISOString()
              });
              localStorage.setItem('fluxFinishedBooks', JSON.stringify(finishedBooks));
              window.dispatchEvent(new CustomEvent('finishedBookAdded', { 
                detail: { book: book.google_books_id } 
              }));
              
              // Update challenges
              try {
                const storedChallenges = localStorage.getItem('userChallenges');
                if (storedChallenges) {
                  const challenges = JSON.parse(storedChallenges);
                  if (challenges && challenges.length > 0) {
                    const updatedChallenges = challenges.map(challenge => {
                      const booksRead = (challenge.books_read || 0) + 1;
                      const progress_percentage = Math.min(Math.round((booksRead / challenge.target_books) * 100), 100);
                      const readBooks = challenge.readBooks || [];
                      if (!readBooks.includes(book.google_books_id)) {
                        readBooks.push(book.google_books_id);
                      }
                      return { ...challenge, books_read: booksRead, progress_percentage, readBooks };
                    });
                    localStorage.setItem('userChallenges', JSON.stringify(updatedChallenges));
                  }
                }
              } catch (e) {
                console.error('Error updating challenges in localStorage:', e);
              }
            }
          } catch (e) {
            console.error('Error updating finished books in localStorage:', e);
          }

          // Show gamification notification if points were awarded by the backend
          if (response.data.gamification) {
            handleGamificationData(response.data.gamification);
          }

          try {
            awardedPointsBooks.push(book.google_books_id);
            localStorage.setItem('fluxFinishedPointsAwarded', JSON.stringify(awardedPointsBooks));
          } catch (e) {
            console.error('Error saving awarded points books to localStorage:', e);
          }
        } else {
            console.log('Points already awarded for finishing this book:', book.google_books_id);
        }
      }

    } catch (error) {
      console.error('Error updating book status:', error);
    }
  };

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

    const textareaRef = useRef();

    useEffect(() => {
      if (isEditing && textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      }
    }, [isEditing, editText]);
    
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
        {/* Display the review */}
        {!isEditing ? (
          // Normal view
          <>
            <div className="review-header">
              <strong className={theme === 'dark' ? 'dark-strong' : ''}>
                {review.user?.username || 'Unknown User'}
              </strong>
              
              {/* Only show edit/delete buttons if this is the user's review */}
              {isUserReview && (
                <div className="review-actions">
                  <button 
                    onClick={() => setIsEditing(true)}
                    className={`action-btn edit-btn ${theme === 'dark' ? 'dark-edit-btn' : ''}`}
                    aria-label="Edit review"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleReviewDelete(review.id)}
                    className={`action-btn delete-btn ${theme === 'dark' ? 'dark-delete-btn' : ''}`}
                    aria-label="Delete review"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
            <div className="review-content">
              <span className={theme === 'dark' ? 'dark-text' : ''}>
                {review.review_text.split('\n').map((line, idx) => (
                  <React.Fragment key={idx}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}
              </span>
            </div>
          </>
        ) : (
          // Edit view
          <div className={`edit-form ${theme === 'dark' ? 'dark-edit-form' : ''}`}>
            <textarea
              ref={textareaRef}
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
              className={`ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white`}
              aria-label="Close notification"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Achievement Popup */}
      {achievementPopup.show && achievementPopup.achievement && (
  <div 
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      zIndex: 1000
    }}
  >
    <div 
      style={{
        position: "relative",
        backgroundColor: theme === 'dark' ? "#1F2937" : "#FFFFFF",
        borderRadius: "8px",
        padding: "24px",
        width: "300px", 
        maxWidth: "90%",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)",
        textAlign: "center"
      }}
    >
      {/* ONLY ONE Close button - with a clearly visible X */}
      <button
        onClick={closeAchievementPopup}
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          background: "rgba(0, 0, 0, 0.1)",
          color: "#000000",
          width: "30px",
          height: "30px",
          borderRadius: "50%",
          border: "none",
          fontSize: "16px",
          fontWeight: "bold",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        X
      </button>

      <h3
        style={{
          fontSize: "18px",
          fontWeight: "600",
          color: theme === 'dark' ? "#F9FAFB" : "#111827",
          marginBottom: "12px"
        }}
      >
        {achievementPopup.achievement.name}
      </h3>
      
      <p
        style={{
          fontSize: "14px",
          color: theme === 'dark' ? "#D1D5DB" : "#4B5563",
          marginBottom: "16px"
        }}
      >
        {achievementPopup.achievement.description}
      </p>
      
      <div
        style={{
          display: "inline-block",
          padding: "6px 12px",
          backgroundColor: theme === 'dark' ? "#0EA5E9" : "#DBEAFE",
          color: theme === 'dark' ? "#FFFFFF" : "#1E40AF",
          borderRadius: "16px",
          fontSize: "14px",
          fontWeight: "600",
          marginBottom: "16px"
        }}
      >
        +{achievementPopup.achievement.points} points
      </div>
      
      <button
        onClick={closeAchievementPopup}
        style={{
          width: "100%",
          padding: "8px 16px",
          backgroundColor: theme === 'dark' ? "#4B5563" : "#E5E7EB",
          color: theme === 'dark' ? "#FFFFFF" : "#111827",
          borderRadius: "6px",
          border: "none",
          fontWeight: "500",
          cursor: "pointer"
        }}
      >
        Dismiss
      </button>
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
                  <p><strong className={theme === 'dark' ? 'dark-strong' : ''}>Published Year:</strong> <span className={theme === 'dark' ? 'dark-text' : ''}>{book.year}</span></p>
                )}
                {book.description && (
                  <p>
                    <strong className={theme === 'dark' ? 'dark-strong' : ''}>Description:</strong> 
                    <span className={theme === 'dark' ? 'dark-text' : ''}>
                      {book.description.replace(/<[^>]*>/g, '')}
                    </span>
                  </p>
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
                        onClick={() => handleUpdateBookStatus('WANT_TO_READ')}
                        className={`flex-1 py-2 rounded ${
                          bookStatus === 'WANT_TO_READ'
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