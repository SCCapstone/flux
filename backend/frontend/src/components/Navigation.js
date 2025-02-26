import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, User, Heart, LogOut, TrendingUp, Award, Users, Trophy, Search } from 'lucide-react';
import { AuthContext } from '../AuthContext';
import { useContext } from 'react';
import '../styles/Navigation.css';
import '../styles/Gamification.css';

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
      <div className="navbar-container" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '0 16px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Brand on the left */}
        <div className="navbar-brand" style={{ 
          marginRight: 'auto', 
          flexShrink: 0,
          paddingLeft: '0',
          marginLeft: '-10px'
        }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: '1.25rem', 
            fontWeight: 'bold', 
            color: '#4169e1' 
          }}>Welcome to Flux!</h1>
        </div>
               
        {/* Navigation links */}
        <div className="nav-links" style={{ 
          display: 'flex',
          marginLeft: '-10px'
        }}>
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
            onClick={() => navigate('/achievements')}
            className={`nav-link ${location.pathname === '/achievements' ? 'active' : ''}`}
          >
            <Trophy className="w-4 h-4" />
            Achievements
          </button>
          
          <button
            onClick={() => navigate('/challenges')}
            className={`nav-link ${location.pathname === '/challenges' ? 'active' : ''}`}
          >
            <Award className="w-4 h-4" />
            Challenges
          </button>
          
          <button
            onClick={() => navigate('/leaderboard')}
            className={`nav-link ${location.pathname === '/leaderboard' ? 'active' : ''}`}
          >
            <Users className="w-4 h-4" />
            Leaderboard
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
    </nav>
  );
};

export default Navigation;