import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { ThemeContext } from '../ThemeContext';
import ReadlistPopup from '../components/ReadlistPopup';
import '../styles/BestSellers.css';

const FALLBACK_STYLE = {
  backgroundColor: '#1e293b',
  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%239ca3af\' stroke-width=\'1\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Crect x=\'3\' y=\'3\' width=\'18\' height=\'18\' rx=\'2\' ry=\'2\'%3E%3C/rect%3E%3Cline x1=\'3\' y1=\'9\' x2=\'21\' y2=\'9\'%3E%3C/line%3E%3Cline x1=\'9\' y1=\'21\' x2=\'9\' y2=\'9\'%3E%3C/line%3E%3C/svg%3E")',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  backgroundSize: '40px'
};

const NoCoverPlaceholder = () => (
  <div className="no-cover-placeholder">
    <div className="no-cover-icon"></div>
    <p>No Cover Available</p>
  </div>
);

const BestSellers = () => {
  const [bestsellers, setBestsellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
  const [selectedBook, setSelectedBook] = useState(null);

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
              <div className="bestseller-image-container" style={book.image ? {} : FALLBACK_STYLE}>
                {book.image ? (
                  <img 
                    src={book.image}
                    alt={book.title}
                    className="bestseller-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentNode.style.backgroundColor = '#1e293b';
                      e.target.parentNode.style.backgroundImage = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%239ca3af\' stroke-width=\'1\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Crect x=\'3\' y=\'3\' width=\'18\' height=\'18\' rx=\'2\' ry=\'2\'%3E%3C/rect%3E%3Cline x1=\'3\' y1=\'9\' x2=\'21\' y2=\'9\'%3E%3C/line%3E%3Cline x1=\'9\' y1=\'21\' x2=\'9\' y2=\'9\'%3E%3C/line%3E%3C/svg%3E")';
                      e.target.parentNode.style.backgroundRepeat = 'no-repeat';
                      e.target.parentNode.style.backgroundPosition = 'center 40%';
                      e.target.parentNode.style.backgroundSize = '40px';
                      
                      // Add "No Cover Available" text
                      const textEl = document.createElement('p');
                      textEl.innerText = 'No Cover Available';
                      textEl.style.marginTop = '140px';
                      textEl.style.textAlign = 'center';
                      textEl.style.color = '#9ca3af';
                      textEl.style.fontSize = '0.875rem';
                      textEl.style.fontWeight = '500';
                      e.target.parentNode.appendChild(textEl);
                    }}
                  />
                ) : (
                  <NoCoverPlaceholder />
                )}
              </div>
              <div className="bestseller-info">
                <h3 className={theme === 'dark' ? 'text-gray-200' : ''}>{book.title}</h3>
                <p className="bestseller-author">{book.author}</p>
                <div className="bestseller-weeks">
                  <span className="weeks-indicator"></span>
                  Weeks on list: {book.weeks_on_list}
                </div>
              </div>
              <button
                className={`bestseller-readlist-btn ${theme === 'dark' ? 'dark-bestseller-readlist-btn' : ''}`}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click from triggering
                  setSelectedBook(book);
                }}
              >
                Manage Readlists
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Readlist Popup */}
      {selectedBook && (
        <ReadlistPopup
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onSave={() => setSelectedBook(null)}
        />
      )}
    </div>
  );
};

export default BestSellers;