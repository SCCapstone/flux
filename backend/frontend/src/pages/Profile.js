import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../AuthContext';
import Navigation from '../components/Navigation';
import '../styles/Profile.css';
import '../styles/Gamification.css';

const Profile = () => {
  const { user, handleLogin } = useContext(AuthContext);
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
  const [isLoadingGamification, setIsLoadingGamification] = useState(true);

  useEffect(() => {
    if (user?.token) {
      // Fetch profile data
      fetch('http://127.0.0.1:8000/api/profile/', {
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
        })
        .catch(err => console.error('Error fetching profile:', err));
      
      // Fetch gamification data
      fetchGamificationData();
    }
  }, [user]);
  
  const fetchGamificationData = async () => {
    if (!user?.token) return;
    
    setIsLoadingGamification(true);
    try {
      const headers = {
        'Authorization': `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      };
      
      // Fetch points and stats
      const pointsResponse = await fetch('http://127.0.0.1:8000/api/user/points/', { headers });
      const pointsData = await pointsResponse.json();
      setUserPoints(pointsData);
      
      // Fetch achievements
      const achievementsResponse = await fetch('http://127.0.0.1:8000/api/user/achievements/', { headers });
      const achievementsData = await achievementsResponse.json();
      setAchievements(achievementsData);
      
      // Fetch reading streak
      const streakResponse = await fetch('http://127.0.0.1:8000/api/user/streak/', { headers });
      const streakData = await streakResponse.json();
      setReadingStreak(streakData);
      
      // Fetch challenges
      const challengesResponse = await fetch('http://127.0.0.1:8000/api/user/challenges/', { headers });
      const challengesData = await challengesResponse.json();
      setChallenges(challengesData);
      
      // Fetch points history
      const historyResponse = await fetch('http://127.0.0.1:8000/api/user/points/history/', { headers });
      const historyData = await historyResponse.json();
      setPointsHistory(historyData);
      
    } catch (error) {
      console.error('Error fetching gamification data:', error);
    } finally {
      setIsLoadingGamification(false);
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
      const response = await fetch('http://127.0.0.1:8000/api/profile/update/', {
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

  // Rendering gamification UI based on active tab
  const renderGamificationContent = () => {
    if (isLoadingGamification) {
      return <div className="text-center py-8">Loading gamification data...</div>;
    }
    
    switch(activeTab) {
      case 'achievements':
        return (
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Your Achievements</h2>
            {achievements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((achievement) => (
                  <div key={achievement.id} className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 shadow">
                    <div className="flex items-center">
                      <div className="w-12 h-12 flex items-center justify-center bg-blue-100 rounded-full mr-4">
                        {achievement.badge_image ? (
                          <img src={achievement.badge_image} alt={achievement.name} className="w-10 h-10" />
                        ) : (
                          <span className="text-2xl">🏆</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold">{achievement.name}</h3>
                        <p className="text-sm text-gray-600">{achievement.description}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        Earned: {new Date(achievement.date_earned).toLocaleDateString()}
                      </span>
                      <span className="text-sm font-semibold text-blue-600">+{achievement.points} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500">You haven't earned any achievements yet. Keep reading and reviewing books to earn achievements!</p>
            )}
          </div>
        );
        
      case 'challenges':
        return (
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Reading Challenges</h2>
            {challenges.length > 0 ? (
              <div className="space-y-6">
                {challenges.map((challenge) => (
                  <div key={challenge.id} className="border rounded-lg p-4">
                    <h3 className="text-xl font-bold">{challenge.name}</h3>
                    <p className="text-gray-600 mb-3">{challenge.description}</p>
                    
                    <div className="mb-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress: {challenge.books_read} / {challenge.target_books} books</span>
                        <span>{challenge.progress_percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${challenge.progress_percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className={challenge.completed ? "text-green-600" : "text-blue-600"}>
                        {challenge.completed ? "Completed!" : `${challenge.days_remaining} days remaining`}
                      </span>
                      <span>
                        {challenge.completed 
                          ? `Completed on ${new Date(challenge.completed_date).toLocaleDateString()}`
                          : `Ends on ${new Date(challenge.end_date).toLocaleDateString()}`
                        }
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-500 mb-4">You're not participating in any reading challenges yet.</p>
                <button className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">
                  Join a Challenge
                </button>
              </div>
            )}
          </div>
        );
        
      case 'stats':
        return (
          <div className="space-y-6">
            {/* Points and Level Card */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <div className="flex flex-col md:flex-row justify-between">
                <div className="text-center mb-4 md:mb-0">
                  <div className="text-gray-600">Your Level</div>
                  <div className="text-5xl font-bold text-blue-600">{userPoints?.level || 1}</div>
                  <div className="text-sm text-gray-500">Keep reading to level up!</div>
                </div>
                
                <div className="text-center">
                  <div className="text-gray-600">Total Points</div>
                  <div className="text-5xl font-bold text-purple-600">{userPoints?.total_points || 0}</div>
                  <div className="text-sm text-gray-500">
                    {userPoints?.level ? `${100 - (userPoints.total_points % 100)} points to next level` : 'Start earning points!'}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Reading Stats Card */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Reading Stats</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600">{userPoints?.books_read || 0}</div>
                  <div className="text-sm text-gray-600">Books Read</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-purple-600">{userPoints?.reviews_written || 0}</div>
                  <div className="text-sm text-gray-600">Reviews</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">{achievements.length}</div>
                  <div className="text-sm text-gray-600">Achievements</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-orange-600">{readingStreak?.current_streak || 0}</div>
                  <div className="text-sm text-gray-600">Day Streak</div>
                </div>
              </div>
            </div>
            
            {/* Points History */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
              {pointsHistory.length > 0 ? (
                <div className="divide-y">
                  {pointsHistory.slice(0, 10).map((item, index) => (
                    <div key={index} className="py-3 flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                        item.amount > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {item.amount > 0 ? '+' : ''}{item.amount}
                      </div>
                      <div>
                        <div className="font-medium">{item.description}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(item.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500">No activity recorded yet.</p>
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

  if (!user) {
    return <p className="profile-container">Please log in to view your profile.</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-6">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        
        {/* Gamification Summary */}
<div className="bg-white shadow-md rounded-lg p-4 mb-6 flex flex-col md:flex-row items-center justify-between">
  <div className="flex items-center mb-4 md:mb-0">
    <div className="w-16 h-16 rounded-full overflow-hidden mr-4 border-4 border-blue-500">
      <img 
        src={previewImage || '/default-profile.png'} 
        alt="Profile" 
        className="w-full h-full object-cover"
      />
    </div>
    <div>
      <h1 className="text-2xl font-bold">{profile.username}</h1>
      <div className="flex space-x-4 text-sm text-gray-600">
        <span className="badge bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
          Level {userPoints?.level || 1}
        </span>
        <span className="badge bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
          {userPoints?.total_points || 0} Points
        </span>
        <span className="badge bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
          {readingStreak?.current_streak || 0} Day Streak
        </span>
      </div>
    </div>
  </div>
  
  {/* Progress to next level - styled */}
  {userPoints && (
    <div className="w-full md:w-1/3">
      <div className="flex justify-between text-xs mb-1">
        <span>Level {userPoints.level}</span>
        <span>Level {userPoints.level + 1}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-in-out" 
          style={{ width: `${userPoints.total_points % 100}%` }}
        ></div>
      </div>
      <div className="text-xs text-center mt-1">
        {100 - (userPoints.total_points % 100)} points to next level
      </div>
    </div>
  )}
</div>
        
        {/* Navigation Tabs */}
        <div className="flex mb-6">
  {['profile', 'stats', 'achievements', 'challenges'].map((tab) => (
    <button
      key={tab}
      className={`px-4 py-2 font-medium ${activeTab === tab 
        ? 'border-b-2 border-blue-500 text-blue-600' 
        : 'text-gray-500 hover:text-gray-700'}`}
      onClick={() => setActiveTab(tab)}
    >
      {tab.charAt(0).toUpperCase() + tab.slice(1)}
    </button>
  ))}
</div>
        
        {/* Main Content */}
        {renderGamificationContent()}
      </div>
    </div>
  );
};

export default Profile;