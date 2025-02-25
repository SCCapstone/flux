import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useContext } from "react";
import { AuthContext } from "../AuthContext";
import Navigation from "../components/Navigation";
import "../styles/Book-Details.css";
import StarRating from "../components/StarRating";

function BookDetails() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const locationRouter = useLocation();
  
  const [book, setBook] = useState(null);
  const [rating, setRating] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [newReviewText, setNewReviewText] = useState("");

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

      fetchRatings();
      fetchReviews();
    }
  }, [book]);

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
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="book-details">
          <h2 className="text-2xl font-bold mb-4">{book.title}</h2>

          <div className="book-content">
            <div className="book-image-container">
              {book.image && <img src={book.image} alt={book.title} className="book-image" />}
            </div>

            <div className="book-info">
              {book.author && <p><strong>Authors:</strong> {book.author}</p>}
              {book.year && <p><strong>Published Date:</strong> {book.year}</p>}
              {book.description && <p><strong>Description:</strong> {book.description}</p>}
              {book.genre && <p><strong>Genres:</strong> {book.genre}</p>}
            </div>
          </div>

          <div className="rating-section mt-8">
            <h3 className="text-xl font-semibold mb-4">Rate Book</h3>
            <StarRating totalStars={5} value={rating} onRatingChange={setRating} />
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
              <button onClick={() => console.log("Submitting review")} className="submit-review-button">
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
