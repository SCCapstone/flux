import React, {useState, useContext, useEffect} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../AuthContext';
import '../styles/Home.css';
import { FetchBooks } from '../components/FetchBooks';
import DisplayBooks from "../components/DisplayBooks.js";


const AuthorDetails = () => {
  const { handleLogout } = useContext(AuthContext);
  const navigate = useNavigate();
  const locationRouter = useLocation();
  const [books, setBooks] = useState([]);
  const [query, setQuery] = useState('');
  const [favorites, setFavorites] = useState(() => {
    return JSON.parse(localStorage.getItem('favorites')) || [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [author, setAuthor] = useState('');

  const fetchBooksByAuthor = async () => {
    if (locationRouter.state?.book) {
      const data = locationRouter.state.book;
      setAuthor(data.author);
      setQuery('inauthor:' + data.author);
      try {
        setLoading(true);
        const fetchedBooks = await FetchBooks('inauthor:' + data.author, 1, 'title');
        setBooks(fetchedBooks);
        setPage(1);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
  fetchBooksByAuthor();
}, [locationRouter]);

  const goToProfile = () => {
    navigate('/profile');
  };

  const goToFavorites = () => {
    navigate('/favorites');
  };

  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith(`${name}=`)) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  const handleLogoutClick = async () => {
    try {
      await axios.post('http://127.0.0.1:8000/api/logout/', {}, {
        headers: {
          'X-CSRFToken': getCookie('csrftoken'),
        },
      });
      handleLogout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error.response || error.message);
      alert('Failed to logout. Please try again.');
    }
  };

  const handleNextPage = async () => {
    const nextPage = page + 1;
    setLoading(true);
    setError('');
    try {
      const books = await fetchBooksByAuthor(query, nextPage, 'title');
      setBooks(books);
      setPage(nextPage);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousPage = async () => {
    const prevPage = Math.max(1, page - 1);
    setLoading(true);
    setError('');
    try {
      const books = await fetchBooksByAuthor(query, prevPage, 'title');
      setBooks(books);
      setPage(prevPage);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = (book) => {
    const isFavorite = favorites.some((fav) => fav.title === book.title);
    const updatedFavorites = isFavorite
      ? favorites.filter((fav) => fav.title !== book.title)
      : [...favorites, book];
    setFavorites(updatedFavorites);
    localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
  };

  return (
    <div className="author-container">
      <div className="header">
        <h1>{author}</h1>
        <div className="nav-buttons">
          <button className="nav-button" onClick={goToProfile}>
            My Profile
          </button>
          <button className="nav-button" onClick={goToFavorites}>
            Favorites
          </button>
          <button className="logout-button" onClick={handleLogoutClick}>
            Logout
          </button>
        </div>
      </div>

      <DisplayBooks
        books={books}
        favorites={favorites}
        handleFavorite={handleFavorite}
        loading={loading}
        error={error}
      />

      <div className="pagination">
        <button onClick={handlePreviousPage} disabled={page === 1}>
          Previous
        </button>
        <span className="page-number">Page {page}</span>
        <button onClick={handleNextPage}>Next</button>
      </div>
    </div>
  );
};

export default AuthorDetails;
