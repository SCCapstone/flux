import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { useNavigate } from 'react-router-dom';
import '../styles/BestSellers.css';

const BestSellers = () => {
  const [bestsellers, setBestsellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBestsellers = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/bestsellers/');
        if (!response.ok) {
          throw new Error('Failed to fetch bestsellers');
        }
        const data = await response.json();
        setBestsellers(data.books);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBestsellers();
  }, []);

  const handleBookClick = (book) => {
    navigate('/book-details', { 
      state: { 
        book: {
          id: book.google_books_id,
          title: book.title,
          author: book.author,
          description: book.description,
          image: book.image,
          genre: book.genre
        }
      } 
    });
  };

  if (loading) return (
    <div>
      <Navigation />
      <div className="loading">Loading bestsellers...</div>
    </div>
  );

  if (error) return (
    <div>
      <Navigation />
      <div className="error">Error: {error}</div>
    </div>
  );

  return (
    <div>
      <Navigation />
      <div className="bestsellers-container">
        <h2>NYT Bestsellers</h2>
        <div className="bestsellers-grid">
          {bestsellers.map((book, index) => (
            <div 
              key={index} 
              className="book-card"
              onClick={() => handleBookClick(book)}
            >
              <div className="rank-badge">#{book.rank}</div>
              <img 
                src={book.image || '/placeholder-book.png'} 
                alt={book.title}
                className="book-image"
              />
              <div className="book-info">
                <h3>{book.title}</h3>
                <p className="author">by {book.author}</p>
                <p className="weeks">Weeks on list: {book.weeks_on_list}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BestSellers;