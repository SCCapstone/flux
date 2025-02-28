import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, User, Heart, LogOut, TrendingUp, Award, Users, Trophy, List } from 'lucide-react';
import { AuthContext } from '../AuthContext';
import '../styles/Navigation.css';
import '../styles/Gamification.css';

const Navigation = () => {
  const { handleLogout, userLevel, userPoints } = useContext(AuthContext);
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
        {/* Brand on the left */}
        <div className="navbar-brand">
          <h1>Welcome to Flux!</h1>
        </div>

        {/* Level Badge */}
        <div className="level-badge">
          <div className="level-text">LEVEL</div>
          <div className="level-number">{userLevel || 1}</div>
          <div className="level-points">{userPoints || 0} PTS</div>
        </div>

        {/* Navigation Links */}
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
    </nav>
  );
};

export default Navigation;
