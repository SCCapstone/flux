import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, User, Heart, LogOut, TrendingUp, Search } from 'lucide-react';
import { AuthContext } from '../AuthContext';
import { useContext } from 'react';
import '../styles/Navigation.css';

const Navigation = () => {
  const { handleLogout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleLogoutClick = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/logout/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
  
      if (response.ok) {
        handleLogout();
        navigate('/login');
      } else {
        throw new Error('Logout request failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
      alert('Failed to logout. Please try again.');
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-content">
          <div className="navbar-brand">
            <h1>Welcome to Flux!</h1>
          </div>
          
          <div className="nav-links">
            <button
              onClick={() => navigate('/')}
              className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            >
              <Home className="w-4 h-4" />
              Home
            </button>
            
            <button
              onClick={() => navigate('/profile')}
              className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}
            >
              <User className="w-4 h-4" />
              Profile
            </button>
            
            <button
              onClick={() => navigate('/favorites')}
              className={`nav-link ${location.pathname === '/favorites' ? 'active' : ''}`}
            >
              <Heart className="w-4 h-4" />
              Favorites
            </button>

            <button
              onClick={() => navigate('/bestsellers')}
              className={`nav-link ${location.pathname === '/bestsellers' ? 'active' : ''}`}
            >
              <TrendingUp className="w-4 h-4" />
              Bestsellers
            </button>
            
            <button
              onClick={() => navigate('/search-users')}
              className={`nav-link ${location.pathname === '/search-users' ? 'active' : ''}`}
            >
              <Search className="w-4 h-4" />
              Find Users
            </button>

            <button
              onClick={handleLogoutClick}
              className="nav-link logout-link"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;