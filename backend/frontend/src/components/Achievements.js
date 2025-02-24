import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../AuthContext';
import Navigation from '../components/Navigation';

const Achievements = () => {
  const { user } = useContext(AuthContext);
  const [achievements, setAchievements] = useState([]);
  const [allAchievements, setAllAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('earned');

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
  
  // Check if user has earned an achievement
  const isAchievementEarned = (achievementId) => {
    return achievements.some(a => a.id === achievementId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6">Achievements</h1>
        
        {/* Tabs */}
        <div className="mb-6 flex space-x-2">
  <button
    onClick={() => setActiveTab('earned')}
    className={`py-2 px-4 rounded-md font-medium ${
      activeTab === 'earned'
        ? 'bg-blue-600 text-white'
        : 'bg-white text-gray-600 hover:bg-gray-100'
    }`}
  >
    Earned ({achievements.length})
  </button>
  <button
    onClick={() => setActiveTab('all')}
    className={`py-2 px-4 rounded-md font-medium ${
      activeTab === 'all'
        ? 'bg-blue-600 text-white'
        : 'bg-white text-gray-600 hover:bg-gray-100'
    }`}
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
            {Object.entries(groupedAchievements()).map(([category, categoryAchievements]) => (
              <div key={category} className="mb-8">
                <h2 className="text-xl font-bold mb-4">{category} Achievements</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {categoryAchievements.map((achievement) => {
                    const earned = isAchievementEarned(achievement.id);
                    return (
                      <div 
                        key={achievement.id} 
                        className={`border rounded-lg p-4 ${
                          earned 
                            ? 'bg-white border-yellow-300' 
                            : 'bg-gray-50 border-gray-200 opacity-75'
                        }`}
                      >
                        <div className="flex items-start">
                          <div 
                            className={`w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center mr-3 ${
                              earned ? 'bg-yellow-100' : 'bg-gray-200'
                            }`}
                          >
                            {achievement.badge_image ? (
                              <img 
                                src={achievement.badge_image} 
                                alt={achievement.name} 
                                className="w-8 h-8" 
                              />
                            ) : earned ? (
                              <span className="text-2xl">🏆</span>
                            ) : (
                              <span className="text-2xl">🔒</span>
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold">{achievement.name}</h3>
                            <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                            <div className="flex justify-between items-center text-sm">
                              <span className={`font-medium ${earned ? 'text-green-600' : 'text-gray-500'}`}>
                                {earned ? 'Earned' : 'Locked'}
                              </span>
                              <span className={`${earned ? 'text-blue-600' : 'text-gray-500'}`}>
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