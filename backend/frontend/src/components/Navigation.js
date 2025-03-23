import React, { useContext, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, User, Heart, LogOut, TrendingUp, Award, Users, Trophy, List, Search, Menu, X } from 'lucide-react';
import { AuthContext } from '../AuthContext';
import '../styles/Navigation.css';

const Navigation = () => {
  const { handleLogout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogoutClick = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/logout/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  const handleNavClick = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-content">
          <div className="navbar-brand">
            <h1>Flux</h1>
          </div>

          <button className="mobile-menu-toggle" onClick={toggleMenu}>
            {isMenuOpen ? <X className="icon" /> : <Menu className="icon" />}
          </button>

          <div className={`nav-links ${isMenuOpen ? 'nav-active' : ''}`}>
            <button onClick={() => handleNavClick('/')} className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
              <Home className="icon" />
              Home
            </button>

            <button onClick={() => handleNavClick('/profile')} className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}>
              <User className="icon" />
              Profile
            </button>

            <button onClick={() => handleNavClick('/favorites')} className={`nav-link ${location.pathname === '/favorites' ? 'active' : ''}`}>
              <Heart className="icon" />
              Favorites
            </button>

            <button onClick={() => handleNavClick('/readlists')} className={`nav-link ${location.pathname === '/readlists' ? 'active' : ''}`}>
              <List className="icon" />
              Readlists
            </button>

            <button onClick={() => handleNavClick('/bestsellers')} className={`nav-link ${location.pathname === '/bestsellers' ? 'active' : ''}`}>
              <TrendingUp className="icon" />
              Bestsellers
            </button>

            <button onClick={() => handleNavClick('/search-users')} className={`nav-link ${location.pathname === '/search-users' ? 'active' : ''}`}>
              <Search className="icon" />
              Find Users
            </button>

            <button onClick={() => handleNavClick('/achievements')} className={`nav-link ${location.pathname === '/achievements' ? 'active' : ''}`}>
              <Trophy className="icon" />
              Achievements
            </button>

            <button onClick={() => handleNavClick('/challenges')} className={`nav-link ${location.pathname === '/challenges' ? 'active' : ''}`}>
              <Award className="icon" />
              Challenges
            </button>

            <button onClick={() => handleNavClick('/leaderboard')} className={`nav-link ${location.pathname === '/leaderboard' ? 'active' : ''}`}>
              <Users className="icon" />
              Leaderboard
            </button>

            <button onClick={handleLogoutClick} className="nav-link logout-link">
              <LogOut className="icon" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;