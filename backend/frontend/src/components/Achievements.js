import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { AuthContext } from '../AuthContext';
import Navigation from './Navigation';
import '../styles/Achievements.css';

const Achievements = () => {
  const { user, userPoints, userLevel, refreshGamificationData } = useContext(AuthContext);
  const [achievements, setAchievements] = useState([]);
  const [allAchievements, setAllAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('earned');
  const [favoriteBooks, setFavoriteBooks] = useState([]);
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

  const fetchAchievements = useCallback(async () => {
    if (!user?.token) return;
    
    setLoading(true);
    try {
      const headers = {
        'Authorization': `Bearer ${user.token}`,
      };
      
      // Fetch all possible achievements
      const allResponse = await fetch(`${apiBaseUrl}/achievements/`, { headers });
      const allData = await allResponse.json();
      setAllAchievements(allData);
      
      // Fetch user's earned achievements
      const userResponse = await fetch(`${apiBaseUrl}/user/achievements/`, { headers });
      const userData = await userResponse.json();
      setAchievements(userData);
      
      // Fetch user's favorite books
      const favoritesResponse = await fetch(`${apiBaseUrl}/favorites/`, { headers });
      const favoritesData = await favoritesResponse.json();
      setFavoriteBooks(favoritesData);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.token) {
      fetchAchievements();
    }
  }, [user, fetchAchievements]);

  // Check if user has earned an achievement
  const isAchievementEarned = (achievementId) => {
    return achievements.some(a => a.id === achievementId);
  };
  
  // Function to display simple collection achievements list
  const renderSimpleCollectionAchievements = () => {
    const bookCount = favoriteBooks.length;
    
    // Collection achievement definitions
    const collectionDefinitions = [
      { 
        id: 'collector', 
        name: 'Collector', 
        target: 5, 
        progress: Math.min(bookCount, 5),
        description: `Add 5 books to favorites`
      },
      { 
        id: 'enthusiast', 
        name: 'Enthusiast', 
        target: 25, 
        progress: Math.min(bookCount, 25),
        description: `Add 25 books to favorites`
      },
      { 
        id: 'booklover', 
        name: 'Book Lover', 
        target: 50, 
        progress: Math.min(bookCount, 50),
        description: `Add 50 books to favorites`
      }
    ];
    
    return (
      <div className="collection-achievements">
        <h2 className="category-title">Collection Achievements</h2>
        
        {bookCount === 0 ? (
          <p className="empty-state">Start adding books to your favorites to earn collection achievements!</p>
        ) : (
          <div>
            {collectionDefinitions.map((achievement) => (
              <div key={achievement.id} className="collection-achievement">
                <div className="collection-title">
                  <span className="collection-title-icon">🔶</span>
                  <span className="collection-title-text">{achievement.name}</span>
                </div>
                <div className="collection-progress">
                  {achievement.progress} / {achievement.target} books
                </div>
                <div className="collection-description">
                  {achievement.description}
                </div>
                
                {/* Progress bar */}
                <div className="progress-container">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill progress-fill-blue" 
                      style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Group achievements by category
  const groupedAchievements = () => {
    const displayAchievements = activeTab === 'earned' ? achievements : allAchievements;
    
    const grouped = displayAchievements.reduce((acc, achievement) => {
      // Determine category based on achievement name/description
      let category = 'Other';
      
      if (achievement.name.includes('Book') || achievement.description.includes('book')) {
        category = 'Reading';
      } else if (achievement.name.includes('Review') || achievement.description.includes('review')) {
        category = 'Reviews';
      } else if (achievement.name.includes('Collector') || achievement.name.includes('Enthusiast') || achievement.description.includes('favorites')) {
        category = 'Collections';
      } else if (achievement.name.includes('Challenge') || achievement.description.includes('challenge')) {
        category = 'Challenges';
      } else if (achievement.name.includes('Streak') || achievement.description.includes('streak')) {
        category = 'Streaks';
      }
      
      if (!acc[category]) {
        acc[category] = [];
      }
      
      acc[category].push(achievement);
      
      return acc;
    }, {});
    
    return grouped;
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="achievements-container">
        <div className="achievements-header">
          <h1 className="achievements-title">Achievements</h1>
        </div>
        
        {/* Level and Points Display */}
        <div className="level-badge-container">
          <div className="level-badge">
            <span className="level-label">Level</span>
            <span className="level-value">{userLevel || 1}</span>
            <span className="points-value">{userPoints || 0} PTS</span>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="tab-buttons">
          <button
            onClick={() => setActiveTab('earned')}
            className={`tab-button ${activeTab === 'earned' ? 'active' : ''}`}
          >
            Earned ({achievements.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
          >
            All Achievements
          </button>
        </div>
        
        {loading ? (
          <div className="loading-state">
            <p>Loading achievements...</p>
          </div>
        ) : (
          <>
            {activeTab === 'earned' && renderSimpleCollectionAchievements()}
            
            {Object.entries(groupedAchievements()).map(([category, categoryAchievements]) => (
              <div key={category} className="achievement-category">
                <h2 className="category-title">{category} Achievements</h2>
                <div className="badges-container">
                  {categoryAchievements.map((achievement) => {
                    const earned = isAchievementEarned(achievement.id);
                    return (
                      <div 
                        key={achievement.id} 
                        className={`badge-item ${earned ? '' : 'badge-locked'}`}
                      >
                        <div className="badge-icon">
                          {achievement.badge_image ? (
                            <img 
                              src={achievement.badge_image} 
                              alt={achievement.name} 
                              style={{ width: '2rem', height: '2rem' }}
                            />
                          ) : earned ? (
                            <span>🏆</span>
                          ) : (
                            <span>🔒</span>
                          )}
                        </div>
                        <div className="badge-name">
                          {achievement.name}
                        </div>
                        {earned && (
                          <div className="achievement-points">
                            +{achievement.points}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* List view for achievements */}
                <div className="achievements-list">
                  {categoryAchievements.map((achievement) => {
                    const earned = isAchievementEarned(achievement.id);
                    return (
                      <div 
                        key={`list-${achievement.id}`} 
                        className="achievement-item"
                      >
                        <div className={`badge-icon ${earned ? '' : 'badge-locked'}`}>
                          {achievement.badge_image ? (
                            <img 
                              src={achievement.badge_image} 
                              alt={achievement.name} 
                              style={{ width: '1.5rem', height: '1.5rem' }}
                            />
                          ) : earned ? (
                            <span>🏆</span>
                          ) : (
                            <span>🔒</span>
                          )}
                        </div>
                        
                        <div className="achievement-info">
                          <h3 className="achievement-name">{achievement.name}</h3>
                          <p className="achievement-description">{achievement.description}</p>
                          <div className="achievement-status">
                            <span className={earned ? 'earned-status' : 'locked-status'}>
                              {earned ? 'Earned' : 'Locked'}
                            </span>
                            <span className="status-separator">•</span>
                            <span className="achievement-points">
                              +{achievement.points} pts
                            </span>
                          </div>
                          {earned && achievement.date_earned && (
                            <p className="earned-date">
                              Earned on {new Date(achievement.date_earned).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default Achievements;