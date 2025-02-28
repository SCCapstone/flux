import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { AuthContext } from '../AuthContext';
import Navigation from './Navigation';
import '../styles/Gamification.css';

const Achievements = () => {
  const { user, userPoints, userLevel, refreshGamificationData } = useContext(AuthContext);
  const [achievements, setAchievements] = useState([]);
  const [allAchievements, setAllAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('earned');
  const [favoriteBooks, setFavoriteBooks] = useState([]);

  const fetchAchievements = useCallback(async () => {
    if (!user?.token) return;
    
    setLoading(true);
    try {
      const headers = {
        'Authorization': `Bearer ${user.token}`,
      };
      
      // Fetch all possible achievements
      const allResponse = await fetch('http://127.0.0.1:8000/api/achievements/', { headers });
      const allData = await allResponse.json();
      setAllAchievements(allData);
      
      // Fetch user's earned achievements
      const userResponse = await fetch('http://127.0.0.1:8000/api/user/achievements/', { headers });
      const userData = await userResponse.json();
      setAchievements(userData);
      
      // Fetch user's favorite books
      const favoritesResponse = await fetch('http://127.0.0.1:8000/api/favorites/', { headers });
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
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Collection Achievements</h2>
        
        {bookCount === 0 ? (
          <p>Start adding books to your favorites to earn collection achievements!</p>
        ) : (
          <div className="space-y-4">
            {collectionDefinitions.map((achievement) => (
              <div key={achievement.id} className="mb-6">
                <div className="flex items-center">
                  <span className="mr-2">🔶</span>
                  <span className="font-medium">{achievement.name}</span>
                </div>
                <div className="pl-6 text-gray-700">
                  {achievement.progress} / {achievement.target} books
                </div>
                <div className="pl-6 text-sm text-gray-600">
                  {achievement.description}
                </div>
                
                {/* Progress bar */}
                <div className="progress-container pl-6 mt-2" style={{ maxWidth: '300px' }}>
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
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-4">Achievements</h1>
        
        {/* Level and Points Display */}
        <div className="mb-6">
          <div>Level {userLevel || 1}</div>
          <div>{userPoints || 0} PTS</div>
        </div>
        
        {/* Tabs */}
        <div className="mb-4">
          <button
            onClick={() => setActiveTab('earned')}
            className="mr-1 px-3 py-1 border bg-white"
            style={{ backgroundColor: activeTab === 'earned' ? '#e5e7eb' : '' }}
          >
            Earned ({achievements.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className="px-3 py-1 border bg-white"
            style={{ backgroundColor: activeTab === 'all' ? '#e5e7eb' : '' }}
          >
            All Achievements
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-10">
            <p>Loading achievements...</p>
          </div>
        ) : (
          <>
            {activeTab === 'earned' && renderSimpleCollectionAchievements()}
            
            {Object.entries(groupedAchievements()).map(([category, categoryAchievements]) => (
              <div key={category} className="mb-10">
                <h2 className="text-2xl font-bold mb-4">{category} Achievements</h2>
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
                              className="w-8 h-8" 
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
                <div className="mt-8 space-y-4">
                  {categoryAchievements.map((achievement) => {
                    const earned = isAchievementEarned(achievement.id);
                    return (
                      <div 
                        key={`list-${achievement.id}`} 
                        className="border-b pb-4 mb-4"
                      >
                        <div className="flex items-start">
                          <div 
                            className={`badge-icon mr-3 ${earned ? '' : 'badge-locked'}`}
                            style={{ width: '2.5rem', height: '2.5rem', fontSize: '1.25rem' }}
                          >
                            {achievement.badge_image ? (
                              <img 
                                src={achievement.badge_image} 
                                alt={achievement.name} 
                                className="w-6 h-6" 
                              />
                            ) : earned ? (
                              <span>🏆</span>
                            ) : (
                              <span>🔒</span>
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold">{achievement.name}</h3>
                            <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                            <div className="flex items-center text-sm">
                              <span className={`font-medium ${earned ? 'text-green-600' : 'text-gray-500'}`}>
                                {earned ? 'Earned' : 'Locked'}
                              </span>
                              <span className="mx-2">•</span>
                              <span className="achievement-points inline-block text-xs">
                                +{achievement.points} pts
                              </span>
                            </div>
                            {earned && achievement.date_earned && (
                              <p className="text-xs text-gray-500 mt-1">
                                Earned on {new Date(achievement.date_earned).toLocaleDateString()}
                              </p>
                            )}
                          </div>
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