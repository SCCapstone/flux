import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { AuthContext } from '../AuthContext';
import { ThemeContext } from '../ThemeContext';
import Navigation from './Navigation';
import '../styles/Achievements.css';

const Achievements = () => {
  const { user, userPoints, userLevel, refreshGamificationData } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const [achievements, setAchievements] = useState([]);
  const [allAchievements, setAllAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(false);
  const [activeTab, setActiveTab] = useState('earned');
  const [favoriteBooks, setFavoriteBooks] = useState([]);
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

  const fetchAchievements = useCallback(async () => {
    if (!user?.token) return;
    
    setLoading(true);
    
    const loaderTimer = setTimeout(() => {
      if (loading) {
        setShowLoader(true);
      }
    }, 500);
    
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
      clearTimeout(loaderTimer);
      setLoading(false);
      setShowLoader(false);
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
      <div className={`collection-achievements ${theme === 'dark' ? 'dark-collection' : ''}`}>
        <h2 className={`category-title ${theme === 'dark' ? 'dark-title' : ''}`}>Collection Achievements</h2>
        
        {bookCount === 0 ? (
          <p className={`empty-state ${theme === 'dark' ? 'dark-empty' : ''}`}>Start adding books to your favorites to earn collection achievements!</p>
        ) : (
          <div>
            {collectionDefinitions.map((achievement) => (
              <div key={achievement.id} className={`collection-achievement ${theme === 'dark' ? 'dark-collection-achievement' : ''}`}>
                <div className={`collection-title ${theme === 'dark' ? 'dark-collection-title' : ''}`}>
                  <span className={`collection-title-icon ${theme === 'dark' ? 'dark-collection-icon' : ''}`}>🔶</span>
                  <span className={`collection-title-text ${theme === 'dark' ? 'dark-collection-text' : ''}`}>{achievement.name}</span>
                </div>
                <div className={`collection-progress ${theme === 'dark' ? 'dark-collection-progress' : ''}`}>
                  {achievement.progress} / {achievement.target} books
                </div>
                <div className={`collection-description ${theme === 'dark' ? 'dark-collection-description' : ''}`}>
                  {achievement.description}
                </div>
                
                {/* Progress bar */}
                <div className={`progress-container ${theme === 'dark' ? 'dark-progress-container' : ''}`}>
                  <div className="progress-bar">
                    <div 
                      className={`progress-fill progress-fill-blue ${theme === 'dark' ? 'dark-progress-fill' : ''}`} 
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
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
      <Navigation />
      <div className={`achievements-container ${theme === 'dark' ? 'dark-mode' : ''}`}>
        <div className="achievements-header">
          <h1 className={`achievements-title ${theme === 'dark' ? 'dark-title' : ''}`}>Achievements</h1>
        </div>
        
        {/* Level and Points Display */}
        <div className="level-badge-container">
          <div className={`level-badge ${theme === 'dark' ? 'dark-level-badge' : ''}`}>
            <span className="level-label">Level</span>
            <span className="level-value">{userLevel || 1}</span>
            <span className="points-value">{userPoints || 0} PTS</span>
          </div>
        </div>
        
        {/* Tabs */}
        <div className={`tab-buttons ${theme === 'dark' ? 'dark-tabs' : ''}`}>
          <button
            onClick={() => setActiveTab('earned')}
            className={`tab-button ${activeTab === 'earned' ? 'active' : ''} ${theme === 'dark' ? 'dark-tab' : ''}`}
          >
            Earned ({achievements.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`tab-button ${activeTab === 'all' ? 'active' : ''} ${theme === 'dark' ? 'dark-tab' : ''}`}
          >
            All Achievements
          </button>
        </div>
        
        {loading && showLoader ? (
          <div className={`loading-state ${theme === 'dark' ? 'dark-loading' : ''}`}>
            <p>Loading achievements...</p>
          </div>
        ) : (
          <>
            {activeTab === 'earned' && renderSimpleCollectionAchievements()}
            
            {Object.entries(groupedAchievements()).map(([category, categoryAchievements]) => (
              <div key={category} className={`achievement-category ${theme === 'dark' ? 'dark-category' : ''}`}>
                <h2 className={`category-title ${theme === 'dark' ? 'dark-title' : ''}`}>{category} Achievements</h2>
                <div className="badges-container">
                  {categoryAchievements.map((achievement) => {
                    const earned = isAchievementEarned(achievement.id);
                    return (
                      <div 
                        key={achievement.id} 
                        className={`badge-item ${earned ? '' : 'badge-locked'} ${theme === 'dark' ? 'dark-badge' : ''}`}
                      >
                        <div className={`badge-icon ${earned ? '' : 'badge-locked'} ${theme === 'dark' ? 'dark-badge-icon' : ''}`}>
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
                        <div className={`badge-name ${theme === 'dark' ? 'dark-badge-name' : ''}`}>
                          {achievement.name}
                        </div>
                        {earned && (
                          <div className={`achievement-points ${theme === 'dark' ? 'dark-points' : ''}`}>
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
                        className={`achievement-item ${theme === 'dark' ? 'dark-item' : ''}`}
                      >
                        <div className={`badge-icon ${earned ? '' : 'badge-locked'} ${theme === 'dark' ? 'dark-badge-icon' : ''}`}>
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
                          <h3 className={`achievement-name ${theme === 'dark' ? 'dark-name' : ''}`}>{achievement.name}</h3>
                          <p className={`achievement-description ${theme === 'dark' ? 'dark-description' : ''}`}>{achievement.description}</p>
                          <div className="achievement-status">
                            <span className={earned ? `earned-status ${theme === 'dark' ? 'dark-earned' : ''}` : `locked-status ${theme === 'dark' ? 'dark-locked' : ''}`}>
                              {earned ? 'Earned' : 'Locked'}
                            </span>
                            <span className={`status-separator ${theme === 'dark' ? 'dark-separator' : ''}`}>•</span>
                            <span className={`achievement-points ${theme === 'dark' ? 'dark-points' : ''}`}>
                              +{achievement.points} pts
                            </span>
                          </div>
                          {earned && achievement.date_earned && (
                            <p className={`earned-date ${theme === 'dark' ? 'dark-date' : ''}`}>
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