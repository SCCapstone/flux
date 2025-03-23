import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import Navigation from '../components/Navigation';
import FollowButton from '../components/FollowButton';
import '../styles/UserProfile.css';

const UserProfile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
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
      return <p className="no-content-message">No reviews yet.</p>;
    }

    return (
      <div className="reviews-container">
        {profile.recent_reviews.map(review => (
          <div key={review.id} className="review-card">
            <div className="review-header">
              <div className="review-book-info">
                <h3 
                  className="review-book-title"
                  onClick={() => handleBookClick(review.book)}
                >
                  {review.book.title}
                </h3>
                <p className="review-book-author">{review.book.author}</p>
              </div>
            </div>
            <p className="review-text">{review.review_text}</p>
            <p className="review-date">
              {new Date(review.added_date).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    );
  };

  const renderFollowers = () => {
    if (loadingFollowers) {
      return <p className="loading-message">Loading followers...</p>;
    }

    if (!followers.length) {
      return <p className="no-content-message">No followers yet.</p>;
    }

    return (
      <div className="users-grid">
        {followers.map(follower => (
          <div key={follower.username} className="user-card">
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
                <h3 className="user-name">{follower.username}</h3>
                <p className="follow-date">
                  Following since {new Date(follower.follow_date).toLocaleDateString()}
                </p>
              </div>
            </div>
            <FollowButton 
              username={follower.username} 
              onFollowChange={() => fetchFollowers()}
            />
          </div>
        ))}
      </div>
    );
  };

  const renderFollowing = () => {
    if (loadingFollowing) {
      return <p className="loading-message">Loading following...</p>;
    }

    if (!following.length) {
      return <p className="no-content-message">Not following anyone yet.</p>;
    }

    return (
      <div className="users-grid">
        {following.map(user => (
          <div key={user.username} className="user-card">
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
                <h3 className="user-name">{user.username}</h3>
                <p className="follow-date">
                  Following since {new Date(user.follow_date).toLocaleDateString()}
                </p>
              </div>
            </div>
            <FollowButton 
              username={user.username}
              onFollowChange={() => fetchFollowing()}
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
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="profile-container">
          <p className="loading-message">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="profile-container">
          <div className="error-container">
            <p className="error-message">{error}</p>
            <button 
              onClick={() => navigate('/')}
              className="go-back-button"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="profile-container">
        {profile && (
          <>
            <div className="profile-header">
              <div className="profile-avatar-container">
                <img
                  src={profile.profile_image || '/default-profile.png'}
                  alt={`${profile.username}'s profile`}
                  className="profile-avatar"
                />
              </div>
              
              <div className="profile-info">
                <h1 className="profile-username">{profile.username}</h1>
                <p className="profile-bio">{profile.bio || 'No bio available'}</p>
                
                <div className="profile-stats">
                  <button 
                    onClick={() => setActiveTab('followers')}
                    className="stat-item"
                  >
                    <span className="stat-count">{profile.followers_count}</span>
                    <span className="stat-label">Followers</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('following')}
                    className="stat-item"
                  >
                    <span className="stat-count">{profile.following_count}</span>
                    <span className="stat-label">Following</span>
                  </button>
                </div>
                
                <FollowButton 
                  username={profile.username}
                  onFollowChange={handleFollowChange}
                />
              </div>
            </div>
            
            <div className="profile-tabs">
              <button
                onClick={() => setActiveTab('reviews')}
                className={`tab-button ${activeTab === 'reviews' ? 'active' : ''}`}
              >
                Reviews
              </button>
              <button
                onClick={() => setActiveTab('followers')}
                className={`tab-button ${activeTab === 'followers' ? 'active' : ''}`}
              >
                Followers
              </button>
              <button
                onClick={() => setActiveTab('following')}
                className={`tab-button ${activeTab === 'following' ? 'active' : ''}`}
              >
                Following
              </button>
            </div>
            
            <div className="profile-content">
              {renderTabContent()}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserProfile;