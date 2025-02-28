import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../AuthContext';
import Navigation from './Navigation';
import '../styles/Gamification.css';

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
        <div className={`gamification-notification animate-in`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className={`h-5 w-5 ${notification.isPositive ? 'text-green-500' : 'text-red-500'}`} 
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
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{notification.message}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-4">Reading Challenges</h1>
        
        <div className="mb-6">
          <div>Level 1</div>
          <div>0 PTS</div>
        </div>
        
        <div className="mb-4">
          <button
            onClick={() => setActiveTab('active')}
            className="mr-1 px-3 py-1 border bg-white"
            style={{ backgroundColor: activeTab === 'active' ? '#e5e7eb' : '' }}
          >
            Active Challenges
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className="mr-1 px-3 py-1 border bg-white"
            style={{ backgroundColor: activeTab === 'completed' ? '#e5e7eb' : '' }}
          >
            Completed
          </button>
          <button
            onClick={() => setActiveTab('expired')}
            className="mr-1 px-3 py-1 border bg-white"
            style={{ backgroundColor: activeTab === 'expired' ? '#e5e7eb' : '' }}
          >
            Expired
          </button>
          <button
            onClick={() => setActiveTab('available')}
            className="px-3 py-1 border bg-white"
            style={{ backgroundColor: activeTab === 'available' ? '#e5e7eb' : '' }}
          >
            Available Challenges
          </button>
        </div>
        
        <div className="mb-6">
          <button
            onClick={handleCreateChallenge}
            className="px-3 py-1 border bg-white"
          >
            Create New Challenge
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-10">
            <p>Loading challenges...</p>
          </div>
        ) : (
          <div>
            {getFilteredChallenges().length > 0 ? (
              getFilteredChallenges().map(challenge => (
                <div key={challenge.id} className="mb-8 border-b pb-6">
                  <h2 className="text-2xl font-bold mb-2">{challenge.name}</h2>
                  <p className="mb-4">{challenge.description}</p>
                  
                  <div className="mb-4">
                    <p><strong>Goal:</strong> Read {challenge.target_books} books</p>
                    
                    {activeTab === 'active' && (
                      <div className="mt-2 mb-3">
                        <div className="progress-labels">
                          <span>Progress: {challenge.books_read} / {challenge.target_books} books</span>
                          <span>{challenge.progress_percentage}%</span>
                        </div>
                        <div className="progress-container">
                          <div className="progress-bar">
                            <div 
                              className="progress-fill progress-fill-blue" 
                              style={{ width: `${challenge.progress_percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <p>
                      <strong>Starts:</strong> {challenge.start_date}
                      <br />
                      <strong>Ends:</strong> {challenge.end_date}
                    </p>
                    <p className="mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {challenge.days_remaining} days remaining
                      </span>
                    </p>
                  </div>
                  
                  {activeTab === 'available' && (
                    <button 
                      onClick={() => handleJoinChallenge(challenge.id)}
                      className="px-3 py-1 border bg-white"
                    >
                      Join Challenge
                    </button>
                  )}
                  
                  {activeTab === 'active' && (
                    <button 
                      onClick={() => handleQuitChallenge(challenge.id)}
                      className="px-3 py-1 border bg-white"
                    >
                      Quit Challenge
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="py-4">
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