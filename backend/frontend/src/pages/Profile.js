import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import Navigation from '../components/Navigation';
import '../styles/UserProfile.css';

const Profile = () => {
  const navigate = useNavigate();
  const { user, handleLogin, isLoggedIn } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('reviews');
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    password: '',
    bio: '',
    profile_image: ''
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [success, setSuccess] = useState('');

  // This useEffect fetches the profile data
  useEffect(() => {
    const fetchProfile = async () => {
      // Get auth data from localStorage if not in context
      const storedToken = localStorage.getItem('token');
      const storedUserStr = localStorage.getItem('user');
      let storedUser = null;
      
      try {
        if (storedUserStr) {
          storedUser = JSON.parse(storedUserStr);
        }
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
      
      // Try to use context user first, fall back to localStorage
      const token = user?.token || storedToken;
      const username = user?.username || storedUser?.username;
      
      if (!token || !username) {
        setLoading(false);
        setError('Authentication data missing. Please log in again.');
        return;
      }
      
      try {
        setLoading(true);
        
        const response = await axios.get(`http://127.0.0.1:8000/api/users/${username}/profile/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          timeout: 10000
        });
        
        if (response.data) {
          setProfile(response.data);
          
          // Set form data from profile
          setFormData({
            username: username,
            email: response.data.email || user?.email || '',
            password: '',
            bio: response.data.bio || '',
            profile_image: ''
          });
          
          setPreviewImage(response.data.profile_image);
          setError(null);
          
          // If we got a successful response but our context is empty, update the context
          if (!user && storedUser) {
            handleLogin({
              username: storedUser.username,
              email: response.data.email || storedUser.email || '',
              token: storedToken,
              bio: response.data.bio || ''
            });
          }
        } else {
          setError('Profile data is empty.');
        }
      } catch (err) {
        if (err.response?.status === 401) {
          setError('Authentication error: Your session may have expired. Please log in again.');
        } else {
          setError(`Failed to load profile data: ${err.message || 'Unknown error'}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, handleLogin]);

  const fetchFollowers = async () => {
    if (loadingFollowers || !profile) return;
    
    // Get auth data
    const storedToken = localStorage.getItem('token');
    const token = user?.token || storedToken;
    const username = user?.username || profile?.username;
    
    if (!token || !username) return;
    
    try {
      setLoadingFollowers(true);
      
      const response = await axios.get(`http://127.0.0.1:8000/api/users/${username}/followers/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setFollowers(response.data || []);
    } catch (error) {
      console.error('Error fetching followers:', error);
      setFollowers([]);
    } finally {
      setLoadingFollowers(false);
    }
  };

  const fetchFollowing = async () => {
    if (loadingFollowing || !profile) return;
    
    // Get auth data
    const storedToken = localStorage.getItem('token');
    const token = user?.token || storedToken;
    const username = user?.username || profile?.username;
    
    if (!token || !username) return;
    
    try {
      setLoadingFollowing(true);
      
      const response = await axios.get(`http://127.0.0.1:8000/api/users/${username}/following/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setFollowing(response.data || []);
    } catch (error) {
      console.error('Error fetching following:', error);
      setFollowing([]);
    } finally {
      setLoadingFollowing(false);
    }
  };

  // Pre-fetch followers/following data when profile is loaded
  useEffect(() => {
    if (profile) {
      fetchFollowers();
      fetchFollowing();
    }
  }, [profile]);

  // Also fetch followers/following when tab changes
  useEffect(() => {
    if (profile) {
      if (activeTab === 'followers') {
        fetchFollowers();
      } else if (activeTab === 'following') {
        fetchFollowing();
      }
    }
  }, [activeTab, profile]);

  const handleRefreshData = () => {
    setLoading(true);
    setError(null);
    
    // Force a re-fetch of profile data
    const storedToken = localStorage.getItem('token');
    const storedUserStr = localStorage.getItem('user');
    let storedUser = null;
    
    try {
      if (storedUserStr) {
        storedUser = JSON.parse(storedUserStr);
      }
    } catch (e) {
      console.error('Error parsing stored user:', e);
    }
    
    const token = user?.token || storedToken;
    const username = user?.username || storedUser?.username;
    
    if (token && username) {
      axios.get(`http://127.0.0.1:8000/api/users/${username}/profile/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        setProfile(response.data);
        
        // Also update the email field specifically
        if (response.data.email) {
          // Update the form data
          setFormData(prev => ({
            ...prev,
            email: response.data.email
          }));
          
          // Update the user context
          if (user) {
            handleLogin({
              ...user,
              email: response.data.email
            });
          }
        }
        
        setLoading(false);
        // Also update the followers and following
        fetchFollowers();
        fetchFollowing();
      })
      .catch(err => {
        console.error('Refresh failed:', err);
        setError(`Error refreshing data: ${err.message}`);
        setLoading(false);
      });
    } else {
      setError('Cannot refresh: missing authentication data');
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        setFormData({
          ...formData,
          profile_image: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    if (profile) {
      setIsEditing(false);
      setFormData({
        username: profile.username || user?.username || '',
        email: profile.email || user?.email || '',
        password: '',
        bio: profile.bio || '',
        profile_image: ''
      });
      setPreviewImage(profile.profile_image);
      setError('');
      setSuccess('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const storedToken = localStorage.getItem('token');
    const token = user?.token || storedToken;
    
    if (!token) {
      setError('No authentication token found. Please log in again.');
      return;
    }

    try {
      const response = await axios.put('http://127.0.0.1:8000/api/profile/update/', 
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );

      const data = response.data;
      setSuccess('Profile updated successfully');
      
      // Update user context with new info - importantly, use form email
      const updatedUser = {
        ...user,
        token: data.token,
        username: data.user.username,
        email: formData.email // Use form email directly since API might not return it
      };
      
      handleLogin(updatedUser);
      
      // Also manually update localStorage to ensure email is saved
      localStorage.setItem('user', JSON.stringify({
        username: updatedUser.username,
        email: updatedUser.email,
        bio: formData.bio
      }));
      
      // Refresh the profile data
      const profileResponse = await axios.get(`http://127.0.0.1:8000/api/users/${data.user.username}/profile/`, {
        headers: {
          'Authorization': `Bearer ${data.token}`
        }
      });
      
      setProfile(profileResponse.data);
      setPreviewImage(profileResponse.data.profile_image);
      setIsEditing(false);
      
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.error || 'Failed to update profile');
    }
  };

  const handleUserClick = (username) => {
    navigate(`/user/${username}`);
  };

  const handleBookClick = (book) => {
    navigate('/book-details', { 
      state: { 
        book: {
          id: book.google_books_id,
          title: book.title,
          author: book.author,
          image: book.image,
          description: book.description
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
              <img 
                src={review.book.image || '/default-book.png'} 
                alt={review.book.title}
                className="review-book-cover"
                onClick={() => handleBookClick(review.book)}
              />
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
        {following.map(followedUser => (
          <div key={followedUser.username} className="user-card">
            <div 
              className="user-card-info"
              onClick={() => handleUserClick(followedUser.username)}
            >
              <img 
                src={followedUser.profile_image || '/default-profile.png'} 
                alt={followedUser.username}
                className="user-avatar"
              />
              <div className="user-details">
                <h3 className="user-name">{followedUser.username}</h3>
                <p className="follow-date">
                  Following since {new Date(followedUser.follow_date).toLocaleDateString()}
                </p>
              </div>
            </div>
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
        return renderReviews(); // Default to reviews
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="profile-container">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {loading ? (
          <div className="profile-content">
            <p className="loading-message">Loading profile...</p>
          </div>
        ) : isEditing ? (
          <div className="profile-content">
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="profile-avatar-container" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <img 
                  src={previewImage || (profile?.profile_image) || '/default-profile.png'} 
                  alt="Profile" 
                  className="profile-avatar"
                />
              </div>
              
              <div className="form-group">
                <label>Profile Image:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="file-input"
                />
              </div>

              <div className="form-group">
                <label>Username:</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="form-control"
                />
              </div>
              
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="form-control"
                />
              </div>
              
              <div className="form-group">
                <label>Bio:</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  className="bio-input"
                  rows="4"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div className="form-group">
                <label>New Password (leave blank to keep current):</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>

              <div className="button-group">
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          profile ? (
            <>
              <div className="profile-header">
                <div className="profile-avatar-container">
                  <img
                    src={profile?.profile_image || '/default-profile.png'}
                    alt={`${user?.username || profile?.username}'s profile`}
                    className="profile-avatar"
                  />
                </div>
                
                <div className="profile-info">
                  <h1 className="profile-username">{user?.username || profile?.username}</h1>
                  <p className="profile-bio">{profile?.bio || 'No bio available'}</p>
                  
                  <div className="profile-stats">
                    <button 
                      onClick={() => setActiveTab('followers')}
                      className="stat-item"
                    >
                      <span className="stat-count">{profile?.followers_count || 0}</span>
                      <span className="stat-label">Followers</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('following')}
                      className="stat-item"
                    >
                      <span className="stat-count">{profile?.following_count || 0}</span>
                      <span className="stat-label">Following</span>
                    </button>
                  </div>
                  
                  <button
                    onClick={handleEdit}
                    className="follow-button"
                  >
                    Edit Profile
                  </button>
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
          ) : (
            <div className="profile-content">
              <p className="no-content-message">Profile data could not be loaded.</p>
              <button
                onClick={handleRefreshData}
                className="follow-button"
                style={{ maxWidth: '200px', margin: '20px auto' }}
              >
                Retry Loading Profile
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Profile;