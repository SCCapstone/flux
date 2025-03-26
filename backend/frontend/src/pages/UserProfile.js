import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { ThemeContext } from '../ThemeContext';
import Navigation from '../components/Navigation';
import FollowButton from '../components/FollowButton';
import '../styles/UserProfile.css';

const UserProfile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('reviews');
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username || !user?.token) return;
      
      try {
        setLoading(true);
        console.log(`Fetching profile for: ${username}`);
        
        const response = await axios.get(`${apiBaseUrl}/users/${username}/profile/`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        
        console.log('Profile response:', response.data);
        setProfile(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(`Failed to load profile. ${err.response?.data?.error || 'User may not exist.'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username, user]);

  const fetchFollowers = async () => {
    if (loadingFollowers || !username || !user?.token) return;
    
    try {
      setLoadingFollowers(true);
      const response = await axios.get(`${apiBaseUrl}/users/${username}/followers/`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      setFollowers(response.data);
    } catch (error) {
      console.error('Error fetching followers:', error);
    } finally {
      setLoadingFollowers(false);
    }
  };

  const fetchFollowing = async () => {
    if (loadingFollowing || !username || !user?.token) return;
    
    try {
      setLoadingFollowing(true);
      const response = await axios.get(`${apiBaseUrl}/users/${username}/following/`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      setFollowing(response.data);
    } catch (error) {
      console.error('Error fetching following:', error);
    } finally {
      setLoadingFollowing(false);
    }
  };

  // Fetch followers/following when activeTab changes
  useEffect(() => {
    if (activeTab === 'followers') {
      fetchFollowers();
    } else if (activeTab === 'following') {
      fetchFollowing();
    }
  }, [activeTab]);
  
  // Also pre-fetch followers/following data when profile is loaded
  useEffect(() => {
    if (profile && !loadingFollowers && !loadingFollowing) {
      fetchFollowers();
      fetchFollowing();
    }
  }, [profile]);

  const handleFollowChange = (isFollowing) => {
    setProfile(prevProfile => ({
      ...prevProfile,
      is_following: isFollowing,
      followers_count: isFollowing 
        ? prevProfile.followers_count + 1 
        : prevProfile.followers_count - 1
    }));
  };

  const handleUserClick = (clickedUsername) => {
    navigate(`/user/${clickedUsername}`);
  };

  const handleBookClick = (book) => {
    navigate('/book-details', { 
      state: { 
        book: {
          google_books_id: book.google_books_id,
          title: book.title,
          author: book.author,
          image: book.image,
          description: book.description,
          genre: book.genre,
          year: book.year
        }
      } 
    });
  };

  const renderReviews = () => {
    if (!profile?.recent_reviews?.length) {
      return <p className={`no-content-message ${theme === 'dark' ? 'text-gray-300' : ''}`}>No reviews yet.</p>;
    }

    return (
      <div className={`reviews-container ${theme === 'dark' ? 'dark-reviews' : ''}`}>
        {profile.recent_reviews.map(review => (
          <div key={review.id} className={`review-card ${theme === 'dark' ? 'dark-review' : ''}`}>
            <div className="review-header">
              <div className="review-book-info">
                <h3 
                  className={`review-book-title ${theme === 'dark' ? 'text-gray-100' : ''}`}
                  onClick={() => handleBookClick(review.book)}
                >
                  {review.book.title}
                </h3>
                <p className={`review-book-author ${theme === 'dark' ? 'text-gray-300' : ''}`}>{review.book.author}</p>
              </div>
            </div>
            <p className={`review-text ${theme === 'dark' ? 'text-gray-300' : ''}`}>{review.review_text}</p>
            <p className={`review-date ${theme === 'dark' ? 'text-gray-400' : ''}`}>
              {new Date(review.added_date).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    );
  };

  const renderFollowers = () => {
    if (loadingFollowers) {
      return <p className={`loading-message ${theme === 'dark' ? 'text-gray-300' : ''}`}>Loading followers...</p>;
    }

    if (!followers.length) {
      return <p className={`no-content-message ${theme === 'dark' ? 'text-gray-300' : ''}`}>No followers yet.</p>;
    }

    return (
      <div className={`users-grid ${theme === 'dark' ? 'dark-users' : ''}`}>
        {followers.map(follower => (
          <div key={follower.username} className={`user-card ${theme === 'dark' ? 'dark-user' : ''}`}>
            <div 
              className="user-card-info"
              onClick={() => handleUserClick(follower.username)}
            >
              <img 
                src={follower.profile_image || '/default-profile.png'} 
                alt={follower.username}
                className="user-avatar"
              />
              <div className="user-details">
                <h3 className={`user-name ${theme === 'dark' ? 'text-gray-100' : ''}`}>{follower.username}</h3>
                <p className={`follow-date ${theme === 'dark' ? 'text-gray-400' : ''}`}>
                  Following since {new Date(follower.follow_date).toLocaleDateString()}
                </p>
              </div>
            </div>
            <FollowButton 
              username={follower.username} 
              onFollowChange={() => fetchFollowers()}
              theme={theme}
            />
          </div>
        ))}
      </div>
    );
  };

  const renderFollowing = () => {
    if (loadingFollowing) {
      return <p className={`loading-message ${theme === 'dark' ? 'text-gray-300' : ''}`}>Loading following...</p>;
    }

    if (!following.length) {
      return <p className={`no-content-message ${theme === 'dark' ? 'text-gray-300' : ''}`}>Not following anyone yet.</p>;
    }

    return (
      <div className={`users-grid ${theme === 'dark' ? 'dark-users' : ''}`}>
        {following.map(user => (
          <div key={user.username} className={`user-card ${theme === 'dark' ? 'dark-user' : ''}`}>
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
                <p className={`follow-date ${theme === 'dark' ? 'text-gray-400' : ''}`}>
                  Following since {new Date(user.follow_date).toLocaleDateString()}
                </p>
              </div>
            </div>
            <FollowButton 
              username={user.username}
              onFollowChange={() => fetchFollowing()}
              theme={theme}
            />
          </div>
        ))}
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'reviews':
        return renderReviews();
      case 'followers':
        return renderFollowers();
      case 'following':
        return renderFollowing();
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Navigation />
        <div className={`profile-container ${theme === 'dark' ? 'dark-mode' : ''}`}>
          <p className={`loading-message ${theme === 'dark' ? 'text-gray-300' : ''}`}>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Navigation />
        <div className={`profile-container ${theme === 'dark' ? 'dark-mode' : ''}`}>
          <div className={`error-container ${theme === 'dark' ? 'dark-error' : ''}`}>
            <p className="error-message">{error}</p>
            <button 
              onClick={() => navigate('/')}
              className={`go-back-button ${theme === 'dark' ? 'dark-button' : ''}`}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Navigation />
      <div className={`profile-container ${theme === 'dark' ? 'dark-mode' : ''}`}>
        {profile && (
          <>
            <div className={`profile-header ${theme === 'dark' ? 'dark-header' : ''}`}>
              <div className="profile-avatar-container">
                <img
                  src={profile.profile_image || '/default-profile.png'}
                  alt={`${profile.username}'s profile`}
                  className="profile-avatar"
                />
              </div>
              
              <div className="profile-info">
                <h1 className={`profile-username ${theme === 'dark' ? 'text-gray-100' : ''}`}>{profile.username}</h1>
                <p className={`profile-bio ${theme === 'dark' ? 'text-gray-300' : ''}`}>{profile.bio || 'No bio available'}</p>
                
                <div className="profile-stats">
                  <button 
                    onClick={() => setActiveTab('followers')}
                    className={`stat-item ${theme === 'dark' ? 'dark-stat' : ''}`}
                  >
                    <span className={`stat-count ${theme === 'dark' ? 'text-gray-100' : ''}`}>{profile.followers_count}</span>
                    <span className={`stat-label ${theme === 'dark' ? 'text-gray-400' : ''}`}>Followers</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('following')}
                    className={`stat-item ${theme === 'dark' ? 'dark-stat' : ''}`}
                  >
                    <span className={`stat-count ${theme === 'dark' ? 'text-gray-100' : ''}`}>{profile.following_count}</span>
                    <span className={`stat-label ${theme === 'dark' ? 'text-gray-400' : ''}`}>Following</span>
                  </button>
                </div>
                
                <FollowButton 
                  username={profile.username}
                  onFollowChange={handleFollowChange}
                  theme={theme}
                />
              </div>
            </div>
            
            <div className={`profile-tabs ${theme === 'dark' ? 'dark-tabs' : ''}`}>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`tab-button ${activeTab === 'reviews' ? 'active' : ''} ${theme === 'dark' ? 'dark-tab' : ''}`}
              >
                Reviews
              </button>
              <button
                onClick={() => setActiveTab('followers')}
                className={`tab-button ${activeTab === 'followers' ? 'active' : ''} ${theme === 'dark' ? 'dark-tab' : ''}`}
              >
                Followers
              </button>
              <button
                onClick={() => setActiveTab('following')}
                className={`tab-button ${activeTab === 'following' ? 'active' : ''} ${theme === 'dark' ? 'dark-tab' : ''}`}
              >
                Following
              </button>
            </div>
            
            <div className={`profile-content ${theme === 'dark' ? 'dark-content' : ''}`}>
              {renderTabContent()}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserProfile;