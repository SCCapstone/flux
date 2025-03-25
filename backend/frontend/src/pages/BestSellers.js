import React, { useState, useEffect, useContext } from 'react';
import Navigation from '../components/Navigation';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../ThemeContext';
import '../styles/BestSellers.css';

const BestSellers = () => {
  const [bestsellers, setBestsellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    const fetchBestsellers = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/bestsellers/`);
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
  }, [apiBaseUrl]);

  const handleBookClick = (book) => {
    navigate('/book-details', { 
      state: { 
        book: {
          google_books_id: book.google_books_id,
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
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Navigation />
      <div className={`bestsellers-loading ${theme === 'dark' ? 'text-gray-200' : ''}`}>
        <div className={`loading-animation ${theme === 'dark' ? 'dark' : ''}`}></div>
        <p>Loading the latest NYT bestsellers...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Navigation />
      <div className={`bestsellers-error ${theme === 'dark' ? 'dark' : ''}`}>
        <div className="error-icon">⚠️</div>
        <p>Unable to load bestsellers</p>
        <p className="text-sm">{error}</p>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Navigation />
      <div className={`bestsellers-container ${theme === 'dark' ? 'dark-mode' : ''}`}>
        <h2 className={theme === 'dark' ? 'text-gray-200' : ''}>NYT Bestsellers</h2>
        <div className="bestsellers-grid">
          {bestsellers.map((book, index) => (
            <div 
              key={index} 
              className={`bestseller-card ${theme === 'dark' ? 'dark-bestseller-card' : ''}`}
              onClick={() => handleBookClick(book)}
            >
              <div className={`bestseller-rank-badge ${theme === 'dark' ? 'dark-bestseller-rank-badge' : ''}`}>#{book.rank}</div>
              <div className="bestseller-image-container">
                <img 
                  src={book.image || '/placeholder-book.png'} 
                  alt={book.title}
                  className="bestseller-image"
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/placeholder-book.png';
                  }}
                />
              </div>
              <div className="bestseller-info">
                <h3 className={theme === 'dark' ? 'text-gray-200' : ''}>{book.title}</h3>
                <p className="bestseller-author">{book.author}</p>
                <div className="bestseller-weeks">
                  <span className="weeks-indicator"></span>
                  Weeks on list: {book.weeks_on_list}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BestSellers;