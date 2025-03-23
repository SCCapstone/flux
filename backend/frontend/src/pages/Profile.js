import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { ThemeContext } from '../ThemeContext';
import Navigation from '../components/Navigation';
import '../styles/Profile.css';
import '../styles/Gamification.css';

const Profile = () => {
  const navigate = useNavigate();
  const { user, handleLogin } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const [profile, setProfile] = useState({ 
    username: '', 
    email: '', 
    bio: '', 
    profile_image: null 
  });
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    bio: '',
    profile_image: ''
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Gamification states
  const [activeTab, setActiveTab] = useState('profile');
  const [userPoints, setUserPoints] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [readingStreak, setReadingStreak] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [isLoadingGamification, setIsLoadingGamification] = useState(true);
  
  // User following states
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    if (user?.token) {
      // Fetch profile data
      fetch(`${apiBaseUrl}/profile/`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        }
      })
        .then(response => response.json())
        .then(data => {
          setProfile(data);
          setFormData({
            username: data.username,
            email: data.email,
            password: '',
            bio: data.bio || '',
            profile_image: ''
          });
          setPreviewImage(data.profile_image);
          
          // Initial fetch of followers and following
          fetchFollowers();
          fetchFollowing();
        })
        .catch(err => console.error('Error fetching profile:', err));
      
      // Fetch gamification data
      fetchGamificationData();
      
      // Fetch reviews
      fetchUserReviews();
    }
  }, [user]);
  
  // Fetch followers/following when tab changes
  useEffect(() => {
    if (user?.token) {
      if (activeTab === 'followers') {
        fetchFollowers();
      } else if (activeTab === 'following') {
        fetchFollowing();
      }
    }
  }, [activeTab, user?.token]);
  
  const fetchGamificationData = async () => {
    if (!user?.token) return;
    
    setIsLoadingGamification(true);
    try {
      const headers = {
        'Authorization': `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      };
      
    // Fetch user points
    try {
      const pointsResponse = await fetch(`${apiBaseUrl}/user/points/`, { headers });
      const pointsData = await pointsResponse.json();
      setUserPoints(pointsData);
    } catch (error) {
      console.error('Error fetching user points:', error);
    }
    
    // Fetch achievements with localStorage fallback
    try {
      // First check localStorage for achievements
      const localAchievements = localStorage.getItem('userAchievements');
      if (localAchievements) {
        try {
          const parsedAchievements = JSON.parse(localAchievements);
          setAchievements(parsedAchievements);
          console.log('Loaded achievements from localStorage');
        } catch (e) {
          console.warn('Could not parse achievements from localStorage');
        }
      }
      
      // Try to fetch from backend
      const achievementsResponse = await fetch(`${apiBaseUrl}/user/achievements/`, { headers });
      if (achievementsResponse.ok) {
        const achievementsData = await achievementsResponse.json();
        setAchievements(achievementsData);
        // Save to localStorage for future use
        localStorage.setItem('userAchievements', JSON.stringify(achievementsData));
        console.log('Loaded achievements from backend and saved to localStorage');
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
      // If we already loaded from localStorage, we'll keep that data
    }

      // Fetch points and stats
      const pointsResponse = await fetch(`${apiBaseUrl}/user/points/`, { headers });
      const pointsData = await pointsResponse.json();
      setUserPoints(pointsData);
      
      // Fetch achievements
      const achievementsResponse = await fetch(`${apiBaseUrl}/user/achievements/`, { headers });
      const achievementsData = await achievementsResponse.json();
      setAchievements(achievementsData);
      
      // Fetch reading streak
      const streakResponse = await fetch(`${apiBaseUrl}/user/streak/`, { headers });
      const streakData = await streakResponse.json();
      setReadingStreak(streakData);
      
      // Fetch challenges from localStorage first
      const localUserChallenges = localStorage.getItem('userChallenges');
      if (localUserChallenges) {
        try {
          const parsedChallenges = JSON.parse(localUserChallenges);
          setChallenges(parsedChallenges);
          console.log('Loaded challenges from localStorage:', parsedChallenges);
        } catch (e) {
          console.warn('Could not parse user challenges from localStorage');
        }
      }
      
      // Then try fetching challenges from backend
      try {
        const challengesResponse = await fetch(`${apiBaseUrl}/user/challenges/`, { headers });
        if (challengesResponse.ok) {
          const challengesData = await challengesResponse.json();
          setChallenges(challengesData);
          console.log('Loaded challenges from backend:', challengesData);
        }
      } catch (error) {
        console.error('Error fetching challenges from backend:', error);
        // If we already loaded from localStorage, we'll keep that data
      }
      
      // Fetch points history
      const historyResponse = await fetch(`${apiBaseUrl}/user/points/history/`, { headers });
      const historyData = await historyResponse.json();
      setPointsHistory(historyData);
      
    } catch (error) {
      console.error('Error fetching gamification data:', error);
    } finally {
      setIsLoadingGamification(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'challenges' && user?.token) {
      // Re-fetch challenges data when the challenges tab is selected
      fetchGamificationData();
    }
  }, [activeTab, user?.token]);

  const fetchUserChallenges = async () => {
    if (!user?.token) return;
    
    try {
      const response = await fetch(`${apiBaseUrl}/user/challenges/`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setChallenges(data);
      }
    } catch (error) {
      console.error('Error fetching user challenges:', error);
    }
  };

  const handleQuitChallenge = (challengeId) => {
    // Find the challenge to remove
    const challenge = challenges.find(c => c.id === challengeId);
    
    if (challenge) {
      // Update local state immediately for UI responsiveness
      const updatedChallenges = challenges.filter(c => c.id !== challengeId);
      setChallenges(updatedChallenges);
      
      // Update localStorage to persist the change
      localStorage.setItem('userChallenges', JSON.stringify(updatedChallenges));
      
      // Optional: Show a notification that the challenge was quit
      setSuccess(`You've quit the "${challenge.name}" challenge.`);
      
      // Add the challenge back to available challenges in localStorage (if needed)
      try {
        const availableChallengesString = localStorage.getItem('availableChallenges');
        if (availableChallengesString) {
          const availableChallenges = JSON.parse(availableChallengesString);
          availableChallenges.push(challenge);
          localStorage.setItem('availableChallenges', JSON.stringify(availableChallenges));
        }
      } catch (error) {
        console.error('Error updating available challenges:', error);
      }
      
      console.log(`Successfully quit challenge: ${challenge.name}`);
    }
  };
  
  const fetchFollowers = async () => {
    if (loadingFollowers || !user?.username) return;
    
    try {
      setLoadingFollowers(true);
      
      const response = await fetch(`${apiBaseUrl}/users/${user.username}/followers/`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFollowers(data || []);
      } else {
        setFollowers([]);
      }
    } catch (error) {
      console.error('Error fetching followers:', error);
      setFollowers([]);
    } finally {
      setLoadingFollowers(false);
    }
  };

  const fetchFollowing = async () => {
    if (loadingFollowing || !user?.username) return;
    
    try {
      setLoadingFollowing(true);
      
      const response = await fetch(`${apiBaseUrl}/users/${user.username}/following/`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFollowing(data || []);
      } else {
        setFollowing([]);
      }
    } catch (error) {
      console.error('Error fetching following:', error);
      setFollowing([]);
    } finally {
      setLoadingFollowing(false);
    }
  };
  
  const fetchUserReviews = async () => {
    if (!user?.token || !user?.username) return;
    
    try {
      const response = await fetch(`${apiBaseUrl}/users/${user.username}/profile/`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.recent_reviews) {
          setRecentReviews(data.recent_reviews || []);
        }
      }
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      setRecentReviews([]);
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
    setIsEditing(false);
    setFormData({
      username: profile.username,
      email: profile.email,
      password: '',
      bio: profile.bio || '',
      profile_image: ''
    });
    setPreviewImage(profile.profile_image);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${apiBaseUrl}/profile/update/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Profile updated successfully');
        setProfile({
          username: data.user.username,
          email: data.user.email,
          bio: data.user.bio,
          profile_image: data.user.profile_image
        });
        handleLogin({
          ...user,
          token: data.token,
          username: data.user.username,
          email: data.user.email
        });
        setPreviewImage(data.user.profile_image);
        setIsEditing(false);
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('An error occurred while updating the profile');
    }
  };

  // Navigation functions
  const handleUserClick = (username) => {
    window.location.href = `/user/${username}`;
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

  // Rendering UI based on active tab
  const renderGamificationContent = () => {
    if (isLoadingGamification && (activeTab !== 'followers' && activeTab !== 'following')) {
      return <div className="text-center py-8">Loading data...</div>;
    }
    
    switch(activeTab) {
      case 'followers':
        return renderFollowers();
      
      case 'following':
        return renderFollowing();
        case 'achievements':
          return (
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-md rounded-lg p-6`}>
              <h2 className="text-2xl font-bold mb-6">Your Achievements</h2>
              {isLoadingGamification ? (
                <div className="text-center py-8">Loading achievements...</div>
              ) : achievements && achievements.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {achievements.map((achievement) => (
                    <div key={achievement.id} className={`${theme === 'dark' ? 'bg-gradient-to-r from-gray-700 to-gray-800' : 'bg-gradient-to-r from-blue-50 to-purple-50'} rounded-lg p-4 shadow`}>
                      <div className="flex items-center">
                        <div className={`w-12 h-12 flex items-center justify-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-blue-100'} rounded-full mr-4`}>
                          {achievement.badge_image ? (
                            <img src={achievement.badge_image} alt={achievement.name} className="w-10 h-10" />
                          ) : (
                            <span className="text-2xl">🏆</span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold">{achievement.name}</h3>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{achievement.description}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex justify-between items-center">
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          Earned: {new Date(achievement.date_earned).toLocaleDateString()}
                        </span>
                        <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>+{achievement.points} pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className={`text-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>You haven't earned any achievements yet. Keep reading and reviewing books to earn achievements!</p>
                </div>
              )}
            </div>
          );
        
        case 'challenges':
          return (
            <div className="challenges-section">
              <h2 className="text-2xl font-bold mb-4">Reading Challenges</h2>
              
              {isLoadingGamification ? (
                <div className="loading-state">
                  <p>Loading challenges...</p>
                </div>
              ) : challenges.length > 0 ? (
                challenges.map((challenge) => (
                  <div key={challenge.id} className="challenge-item">
                    <h3 className="challenge-title">{challenge.name}</h3>
                    <p className="challenge-description">{challenge.description}</p>
                    
                    <div className="challenge-progress">
                      <div className="challenge-progress-text">
                        <span>Progress: {challenge.books_read} / {challenge.target_books} books</span>
                        <span>{challenge.progress_percentage || 0}%</span>
                      </div>
                      <div className="challenge-progress-bar">
                        <div 
                          className="challenge-progress-fill" 
                          style={{ width: `${challenge.progress_percentage || 0}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="challenge-meta">
                      <div className="challenge-dates">
                        <div className="challenge-date-item">
                          <span>Starts:</span> {challenge.start_date}
                        </div>
                        <div className="challenge-date-item">
                          <span>Ends:</span> {challenge.end_date}
                        </div>
                      </div>
                      
                      <div className="challenge-days">
                        {challenge.days_remaining || 0} days remaining
                      </div>
                    </div>
                    
                    <div className="challenge-action">
                      <button 
                        onClick={() => handleQuitChallenge(challenge.id)}
                        className="quit-challenge-btn"
                      >
                        Quit Challenge
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="challenges-empty">
                  <p>You're not participating in any reading challenges yet.</p>
                  <button 
                    className="join-challenge-btn"
                    onClick={() => window.location.href = '/challenges'}
                  >
                    Join a Challenge
                  </button>
                </div>
              )}
            </div>
          );
        
      case 'stats':
        return (
          <div className="space-y-6">
            {/* Reading Stats Card */}
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-md rounded-lg p-6`}>
              <h3 className="text-xl font-bold mb-4">Reading Stats</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`${theme === 'dark' ? 'bg-blue-900' : 'bg-blue-50'} rounded-lg p-4 text-center`}>
                  <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`}>{userPoints?.books_read || 0}</div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Books Read</div>
                </div>
                <div className={`${theme === 'dark' ? 'bg-purple-900' : 'bg-purple-50'} rounded-lg p-4 text-center`}>
                  <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'}`}>{userPoints?.reviews_written || 0}</div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Reviews</div>
                </div>
                <div className={`${theme === 'dark' ? 'bg-green-900' : 'bg-green-50'} rounded-lg p-4 text-center`}>
                  <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-green-300' : 'text-green-600'}`}>{achievements.length}</div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Achievements</div>
                </div>
                <div className={`${theme === 'dark' ? 'bg-orange-900' : 'bg-orange-50'} rounded-lg p-4 text-center`}>
                  <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-orange-300' : 'text-orange-600'}`}>{readingStreak?.current_streak || 0}</div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Day Streak</div>
                </div>
              </div>
            </div>
            
            {/* Recent Reviews */}
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-md rounded-lg p-6`}>
              <h3 className="text-xl font-bold mb-4">Recent Reviews</h3>
              {recentReviews.length > 0 ? (
                <div className="reviews-list">
                  {recentReviews.map(review => (
                    <div key={review.id} className="review-card">
                      <div className="review-header">
                        <div className="review-book-info">
                          <h4 
                            className="review-book-title"
                            onClick={() => handleBookClick(review.book)}
                          >
                            {review.book.title}
                          </h4>
                          <p className="review-book-author">{review.book.author}</p>
                        </div>
                      </div>
                      <p className="review-text">{review.review_text}</p>
                      <div className="review-date">
                        {new Date(review.added_date).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`text-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>No reviews yet. Start reviewing books!</p>
              )}
            </div>
          </div>
        );
        
      case 'profile':
      default:
        return (
          <div className="profile-content">
            {/* Original profile content goes here */}
            <div className="profile-image-container">
              <img 
                src={previewImage || '/default-profile.png'} 
                alt="Profile" 
                className="profile-image"
              />
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="profile-form">
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
            ) : (
              <div className="profile-info">
                <p><strong>Username:</strong> {profile.username}</p>
                <p><strong>Email:</strong> {profile.email}</p>
                <div className="bio-section">
                  <h3>Bio</h3>
                  <p>{profile.bio || 'No bio yet...'}</p>
                </div>
                <div className="button-group">
                  <button
                    onClick={handleEdit}
                    className="btn btn-primary"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  const renderFollowers = () => {
    if (loadingFollowers) {
      return <div className="loading-message">Loading followers...</div>;
    }

    if (!followers.length) {
      return (
        <div className="empty-state">
          <p>No followers yet.</p>
        </div>
      );
    }

    return (
      <div>
        <h2 className="section-title">Your Followers</h2>
        <div className="user-grid">
          {followers.map(follower => (
            <div 
              key={follower.username} 
              className="user-card"
              onClick={() => handleUserClick(follower.username)}
            >
              <div className="user-avatar-container">
                <img 
                  src={follower.profile_image || '/default-profile.png'} 
                  alt={follower.username}
                  className="user-avatar"
                />
              </div>
              <div className="user-details">
                <h3 className="user-name">{follower.username}</h3>
                <p className="user-meta">
                  Following since {new Date(follower.follow_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderFollowing = () => {
    if (loadingFollowing) {
      return <div className="loading-message">Loading following...</div>;
    }

    if (!following.length) {
      return (
        <div className="empty-state">
          <p>You are not following anyone yet.</p>
        </div>
      );
    }

    return (
      <div>
        <h2 className="section-title">Accounts You Follow</h2>
        <div className="user-grid">
          {following.map(followedUser => (
            <div 
              key={followedUser.username} 
              className="user-card"
              onClick={() => handleUserClick(followedUser.username)}
            >
              <div className="user-avatar-container">
                <img 
                  src={followedUser.profile_image || '/default-profile.png'} 
                  alt={followedUser.username}
                  className="user-avatar"
                />
              </div>
              <div className="user-details">
                <h3 className="user-name">{followedUser.username}</h3>
                <p className="user-meta">
                  Following since {new Date(followedUser.follow_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!user) {
    return <p className="profile-container">Please log in to view your profile.</p>;
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Navigation />
      <div className={`profile-container ${theme === 'dark' ? 'dark-mode' : ''}`}>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        
        {/* Gamification Summary */}
        <div className="profile-summary">
          <div className="summary-left">
            <div className="summary-avatar">
              <img 
                src={previewImage || '/default-profile.png'} 
                alt="Profile" 
                className="summary-avatar-img"
              />
            </div>
            <div className="summary-info">
              <h1 className="summary-username">{profile.username}</h1>
              <div className="badge-container">
                <span className="badge level-badge">
                  Level {userPoints?.level || 1}
                </span>
                <span className="badge points-badge">
                  {userPoints?.total_points || 0} Points
                </span>
                <span className="badge streak-badge">
                  {readingStreak?.current_streak || 0} Day Streak
                </span>
              </div>
            </div>
          </div>
          
          {/* Progress to next level */}
          {userPoints && (
            <div className="level-progress">
              <div className="level-labels">
                <span>Level {userPoints.level}</span>
                <span>Level {userPoints.level + 1}</span>
              </div>
              <div className="progress-bar-bg">
                <div 
                  className="progress-bar-fill"
                  style={{ width: `${userPoints.total_points % 100}%` }}
                ></div>
              </div>
              <div className="progress-text">
                {100 - (userPoints.total_points % 100)} points to next level
              </div>
            </div>
          )}
        </div>
        
        {/* Navigation Tabs */}
        <div className={`profile-tabs ${theme === 'dark' ? 'dark-tabs' : ''}`}>
          {['profile', 'stats', 'achievements', 'challenges', 'followers', 'following'].map((tab) => (
            <button
              key={tab}
              className={`tab-button ${activeTab === tab ? 'active' : ''} ${theme === 'dark' ? 'dark-tab' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        
        {/* Main Content */}
        <div className="profile-content">
          {renderGamificationContent()}
        </div>
      </div>
    </div>
  );
};

export default Profile;