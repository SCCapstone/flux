import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../AuthContext';
import Navigation from './Navigation';
import '../styles/Challenges.css';

const Challenges = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('available');
  const [loading, setLoading] = useState(false);

  // Sample challenges to display
  const sampleAvailableChallenges = [
    {
      id: 'sample1',
      name: 'Summer Reading Challenge',
      description: 'Read 10 books during summer vacation',
      target_books: 10,
      books_read: 0,
      start_date: '2025-06-01',
      end_date: '2025-08-31',
      days_remaining: 90,
      progress_percentage: 0
    },
    {
      id: 'sample2',
      name: 'Genre Explorer',
      description: 'Read books from 5 different genres',
      target_books: 5,
      books_read: 0,
      start_date: '2025-03-01',
      end_date: '2025-04-30',
      days_remaining: 60,
      progress_percentage: 0
    },
    {
      id: 'sample3',
      name: 'Classics Marathon',
      description: 'Read 3 classic literature books',
      target_books: 3,
      books_read: 0,
      start_date: '2025-02-01',
      end_date: '2025-05-01',
      days_remaining: 45,
      progress_percentage: 0
    }
  ];

  const [userChallenges, setUserChallenges] = useState([]);
  const [availableChallenges, setAvailableChallenges] = useState(sampleAvailableChallenges);

  useEffect(() => {
    // Initial setup - we'll use the sample challenges as fallback
    setAvailableChallenges(sampleAvailableChallenges);
  }, []);

  const handleJoinChallenge = (challengeId) => {
    // Find the challenge in available challenges
    const challenge = availableChallenges.find(c => c.id === challengeId);
    
    if (challenge) {
      // Add to user challenges
      setUserChallenges(prev => [...prev, challenge]);
      
      // Remove from available challenges
      setAvailableChallenges(prev => prev.filter(c => c.id !== challengeId));
      
      // Show notification
      showNotification(`Joined the "${challenge.name}" challenge!`, true);
      
      // Switch to active tab to show the joined challenge
      setActiveTab('active');
    }
  };
  
  const handleQuitChallenge = (challengeId) => {
    // Find the challenge in user challenges
    const challenge = userChallenges.find(c => c.id === challengeId);
    
    if (challenge) {
      // Remove from user challenges
      setUserChallenges(prev => prev.filter(c => c.id !== challengeId));
      
      // Add back to available challenges if it was one of the original sample challenges
      if (challengeId.startsWith('sample')) {
        setAvailableChallenges(prev => [...prev, challenge]);
      }
      
      // Show notification
      showNotification(`Quit the "${challenge.name}" challenge`, false);
    }
  };

  const handleCreateChallenge = () => {
    // Create a new challenge with default values
    const newChallenge = {
      id: `new-${Date.now()}`,
      name: 'Custom Reading Challenge',
      description: 'My personal reading challenge',
      target_books: 5,
      books_read: 0,
      start_date: '2025-01-01',
      end_date: '2025-06-30',
      days_remaining: 180,
      progress_percentage: 0
    };
    
    // Add to user challenges
    setUserChallenges(prev => [...prev, newChallenge]);
    
    // Show notification
    showNotification('Created a new reading challenge!', true);
    
    // Switch to active tab
    setActiveTab('active');
  };

  const getFilteredChallenges = () => {
    if (activeTab === 'active') {
      return userChallenges;
    } else if (activeTab === 'available') {
      return availableChallenges;
    } else {
      return []; // Completed and expired are empty for now
    }
  };
  
  // Notification state
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    isPositive: true
  });
  
  // Show notification function
  const showNotification = (message, isPositive = true) => {
    setNotification({
      show: true,
      message,
      isPositive
    });
    
    // Hide after 3 seconds
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      {/* Gamification Notification */}
      {notification.show && (
        <div className={`gamification-notification ${notification.show ? 'animate-in' : 'animate-out'}`}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ flexShrink: 0 }}>
              <svg className={`h-5 w-5`} 
                   style={{ color: notification.isPositive ? '#10b981' : '#ef4444' }}
                   fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {notification.isPositive ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                )}
              </svg>
            </div>
            <div style={{ marginLeft: '0.75rem' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>{notification.message}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="challenges-container">
        <h1 className="challenges-title">Reading Challenges</h1>
        
        <div className="level-badge-container">
          <div className="level-badge">
            <span className="level-label">Level</span>
            <span className="level-value">1</span>
            <span className="points-value">0 PTS</span>
          </div>
        </div>
        
        <div className="tab-buttons">
          <button
            onClick={() => setActiveTab('active')}
            className={`tab-button ${activeTab === 'active' ? 'active' : ''}`}
          >
            Active Challenges
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`tab-button ${activeTab === 'completed' ? 'active' : ''}`}
          >
            Completed
          </button>
          <button
            onClick={() => setActiveTab('expired')}
            className={`tab-button ${activeTab === 'expired' ? 'active' : ''}`}
          >
            Expired
          </button>
          <button
            onClick={() => setActiveTab('available')}
            className={`tab-button ${activeTab === 'available' ? 'active' : ''}`}
          >
            Available Challenges
          </button>
        </div>
        
        <div>
          <button
            onClick={handleCreateChallenge}
            className="create-challenge-btn"
          >
            Create New Challenge
          </button>
        </div>
        
        {loading ? (
          <div className="loading-state">
            <p>Loading challenges...</p>
          </div>
        ) : (
          <div>
            {getFilteredChallenges().length > 0 ? (
              getFilteredChallenges().map(challenge => (
                <div key={challenge.id} className="challenge-card">
                  <h2 className="challenge-title">{challenge.name}</h2>
                  <p className="challenge-description">{challenge.description}</p>
                  
                  <div className="challenge-stats">
                    <div className="challenge-stat">
                      <span className="stat-label">Goal</span>
                      <span className="stat-value">Read {challenge.target_books} books</span>
                    </div>
                    
                    {activeTab === 'active' && (
                      <div className="progress-container">
                        <div className="progress-labels">
                          <span>Progress: {challenge.books_read} / {challenge.target_books} books</span>
                          <span>{challenge.progress_percentage}%</span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill progress-fill-blue" 
                            style={{ width: `${challenge.progress_percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="challenge-dates">
                    <div>
                      <span className="date-label">Starts:</span> {challenge.start_date}
                    </div>
                    <div>
                      <span className="date-label">Ends:</span> {challenge.end_date}
                    </div>
                    <div className="days-remaining">
                      {challenge.days_remaining} days remaining
                    </div>
                  </div>
                  
                  <div className="challenge-action">
                    {activeTab === 'available' && (
                      <button 
                        onClick={() => handleJoinChallenge(challenge.id)}
                        className="join-button"
                      >
                        Join Challenge
                      </button>
                    )}
                    
                    {activeTab === 'active' && (
                      <button 
                        onClick={() => handleQuitChallenge(challenge.id)}
                        className="quit-button"
                      >
                        Quit Challenge
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>
                  {activeTab === 'active' && "You're not participating in any active challenges."}
                  {activeTab === 'completed' && "You haven't completed any challenges yet."}
                  {activeTab === 'expired' && "You don't have any expired challenges."}
                  {activeTab === 'available' && "No available challenges at the moment."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Challenges;