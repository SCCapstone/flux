import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../AuthContext';
import { ThemeContext } from '../ThemeContext';
import Navigation from '../components/Navigation';
import FollowButton from '../components/FollowButton';
import '../styles/UserSearch.css';

const UserSearch = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get(`${apiBaseUrl}/users/search/?q=${searchQuery}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      setSearchResults(response.data);
    } catch (err) {
      console.error('Error searching users:', err);
      setError('Failed to search for users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (username) => {
    navigate(`/user/${username}`);
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Navigation />
      <div className={`user-search-container ${theme === 'dark' ? 'dark-mode' : ''}`}>
        <h1 className={`search-title ${theme === 'dark' ? 'text-gray-100' : ''}`}>Find Users</h1>
        
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username"
            className={`search-input ${theme === 'dark' ? 'dark-input' : ''}`}
          />
          <button type="submit" className={`search-button ${theme === 'dark' ? 'dark-button' : ''}`}>
            Search
          </button>
        </form>
        
        {error && <p className="error-message">{error}</p>}
        
        {loading ? (
          <p className={`loading-message ${theme === 'dark' ? 'text-gray-300' : ''}`}>Searching...</p>
        ) : (
          <div className="search-results">
            {searchResults.length === 0 ? (
              searchQuery ? (
                <p className={`no-results ${theme === 'dark' ? 'text-gray-300' : ''}`}>No users found matching "{searchQuery}"</p>
              ) : null
            ) : (
              <div className={`users-grid ${theme === 'dark' ? 'dark-users' : ''}`}>
                {searchResults.map(user => (
                  <div key={user.username} className={`user-card ${theme === 'dark' ? 'dark-user-card' : ''}`}>
                    <div 
                      className="user-card-info"
                      onClick={() => handleUserClick(user.username)}
                    >
                      <img 
                        src={user.profile_image || '/default-profile.png'} 
                        alt={user.username}
                        className="user-avatar"
                      />
                      <div className="user-details">
                        <h3 className={`user-name ${theme === 'dark' ? 'text-gray-100' : ''}`}>{user.username}</h3>
                        {user.bio && (
                          <p className={`user-bio ${theme === 'dark' ? 'text-gray-300' : ''}`}>{user.bio}</p>
                        )}
                      </div>
                    </div>
                    <FollowButton 
                      username={user.username}
                      onFollowChange={() => {}}
                      theme={theme}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSearch;