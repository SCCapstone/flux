import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, User, Heart, LogOut, TrendingUp, Award, Users, Trophy, List, Search } from 'lucide-react';
import { AuthContext } from '../AuthContext';
import '../styles/Navigation.css';

const Navigation = () => {
  const { handleLogout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoutClick = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/logout/', {
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

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-content">
          <div className="navbar-brand">
            <h1>Flux</h1>
          </div>

          <div className="nav-links">
            <button onClick={() => navigate('/')} className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
              <Home className="icon" />
              Home
            </button>

            <button onClick={() => navigate('/profile')} className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}>
              <User className="icon" />
              Profile
            </button>

            <button onClick={() => navigate('/favorites')} className={`nav-link ${location.pathname === '/favorites' ? 'active' : ''}`}>
              <Heart className="icon" />
              Favorites
            </button>

            <button onClick={() => navigate('/readlists')} className={`nav-link ${location.pathname === '/readlists' ? 'active' : ''}`}>
              <List className="icon" />
              Readlists
            </button>

            <button onClick={() => navigate('/bestsellers')} className={`nav-link ${location.pathname === '/bestsellers' ? 'active' : ''}`}>
              <TrendingUp className="icon" />
              Bestsellers
            </button>

            <button onClick={() => navigate('/search-users')} className={`nav-link ${location.pathname === '/search-users' ? 'active' : ''}`}>
              <Search className="icon" />
              Find Users
            </button>

            <button onClick={() => navigate('/achievements')} className={`nav-link ${location.pathname === '/achievements' ? 'active' : ''}`}>
              <Trophy className="icon" />
              Achievements
            </button>

            <button onClick={() => navigate('/challenges')} className={`nav-link ${location.pathname === '/challenges' ? 'active' : ''}`}>
              <Award className="icon" />
              Challenges
            </button>

            <button onClick={() => navigate('/leaderboard')} className={`nav-link ${location.pathname === '/leaderboard' ? 'active' : ''}`}>
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