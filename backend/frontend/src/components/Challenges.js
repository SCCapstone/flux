import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { ThemeContext } from '../ThemeContext';
import Navigation from './Navigation';
import '../styles/Challenges.css';

const Challenges = () => {
  const { user } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const [activeTab, setActiveTab] = useState('available');
  const [loading, setLoading] = useState(false);
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

  // Sample challenges as fallback
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
  const [completedChallenges, setCompletedChallenges] = useState([]);
  
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

  // Function to fetch challenges from the backend
  const fetchChallenges = async () => {
    if (!user?.token) return;
    
    setLoading(true);
    try {
      // Get local data first
      let localUserChallenges = [];
      try {
        const storedChallenges = localStorage.getItem('userChallenges');
        if (storedChallenges) {
          localUserChallenges = JSON.parse(storedChallenges);
          console.log('Loaded user challenges from localStorage:', localUserChallenges);
        }
      } catch (e) {
        console.warn('Error loading from localStorage:', e);
      }
      
      // Set user challenges from localStorage immediately for responsiveness
      setUserChallenges(localUserChallenges);
      
      // Get completed challenges if they exist
      let completedChallenges = [];
      try {
        const storedCompletedChallenges = localStorage.getItem('completedChallenges');
        if (storedCompletedChallenges) {
          completedChallenges = JSON.parse(storedCompletedChallenges);
          setCompletedChallenges(completedChallenges);
        }
      } catch (e) {
        console.warn('Error loading completed challenges:', e);
      }
      
      // Get book count directly from favorites - THIS IS THE KEY CHANGE
      let bookCount = 0;
      try {
        // Same approach as in the Achievements component
        const favorites = localStorage.getItem('favorites');
        if (favorites) {
          const favoritesData = JSON.parse(favorites);
          bookCount = favoritesData.length;
        }
        console.log('Book count from favorites:', bookCount);
      } catch (e) {
        console.warn('Error getting book count from favorites:', e);
      }
      
      // Use the book count for challenges
      if (localUserChallenges.length > 0) {
        console.log('Updating challenge progress with book count:', bookCount);
        
        // Process active vs. completed challenges
        const active = [];
        const completed = [];
        
        localUserChallenges.forEach(challenge => {
          // Only count up to the target for each challenge
          const booksRead = Math.min(bookCount, challenge.target_books);
          const progress_percentage = Math.round((booksRead / challenge.target_books) * 100);
          
          const updatedChallenge = {
            ...challenge,
            books_read: booksRead,
            progress_percentage
          };
          
          // Move to completed if 100%
          if (progress_percentage === 100) {
            completed.push(updatedChallenge);
          } else {
            active.push(updatedChallenge);
          }
        });
        
        // Combine with existing completed challenges
        const existingCompletedIds = completedChallenges.map(c => c.id);
        const newCompleted = completed.filter(c => !existingCompletedIds.includes(c.id));
        const allCompleted = [...completedChallenges, ...newCompleted];
        
        // Update state
        setUserChallenges(active);
        setCompletedChallenges(allCompleted);
        
        // Save to localStorage
        localStorage.setItem('userChallenges', JSON.stringify(active));
        localStorage.setItem('completedChallenges', JSON.stringify(allCompleted));
      }
      
      // Define a function to remove duplicates by name
      const removeDuplicates = (challenges) => {
        const seen = new Set();
        return challenges.filter(challenge => {
          const duplicate = seen.has(challenge.name);
          seen.add(challenge.name);
          return !duplicate;
        });
      };
      
      // Get available challenges (either from backend or sample data)
      let availableChallengesData = [];
      try {
        const response = await fetch(`${apiBaseUrl}/challenges/`, {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          availableChallengesData = await response.json();
          console.log('Fetched available challenges:', availableChallengesData);
        }
      } catch (error) {
        console.error('Error fetching available challenges:', error);
      }
      
      // If no challenges from backend, use sample data
      if (availableChallengesData.length === 0) {
        availableChallengesData = sampleAvailableChallenges;
        console.log('Using sample challenges:', availableChallengesData);
      }
      
      // Filter out challenges that the user is already participating in
      const activeAndCompletedNames = new Set([
        ...localUserChallenges.map(c => c.name),
        ...completedChallenges.map(c => c.name)
      ]);
      
      const filteredAvailableChallenges = availableChallengesData.filter(
        challenge => !activeAndCompletedNames.has(challenge.name)
      );
      
      console.log('Filtered available challenges:', filteredAvailableChallenges);
      
      // Remove any duplicates and update state
      setAvailableChallenges(removeDuplicates(filteredAvailableChallenges));
    } catch (error) {
      console.error('Error in fetchChallenges:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize sample challenges if needed - with fallback to local state
  const initializeSampleChallenges = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/challenges/initialize-samples/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Sample challenges initialized:', data);
        // After initializing, fetch challenges again
        await fetchChallenges();
      } else {
        console.warn('Backend initialization failed. Using local sample challenges.');
        // Use local sample challenges
        setAvailableChallenges(sampleAvailableChallenges);
      }
    } catch (error) {
      console.error('Error initializing sample challenges:', error);
      setAvailableChallenges(sampleAvailableChallenges);
    }
  };

  // Initial data loading
  useEffect(() => {
    if (user?.token) {
      fetchChallenges();
    } else {
      // Fallback to sample data if no user is logged in
      setAvailableChallenges(sampleAvailableChallenges);
    }
  }, [user?.token]); 

  useEffect(() => {
    const handleFinishedBookAdded = () => {
      console.log('Finished book added, refreshing challenges');
      fetchChallenges();
    };
    
    window.addEventListener('finishedBookAdded', handleFinishedBookAdded);
    
    return () => {
      window.removeEventListener('finishedBookAdded', handleFinishedBookAdded);
    };
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      console.log('Storage changed, refreshing challenges');
      fetchChallenges();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('finishedBookAdded', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('finishedBookAdded', handleStorageChange);
    };
  }, []);

  const handleJoinChallenge = (challengeId) => {
    console.log('Join challenge called with ID:', challengeId);
    console.log('Available challenges:', availableChallenges);
    
    setLoading(true);
    
    // More careful check
    if (!availableChallenges || !Array.isArray(availableChallenges)) {
      console.error('Available challenges not loaded yet');
      setLoading(false);
      return;
    }
    
    // Find the challenge in available challenges
    const challengeToJoin = availableChallenges.find(c => c.id === challengeId);
    
    if (!challengeToJoin) {
      console.error(`Challenge with ID ${challengeId} not found in available challenges`);
      setLoading(false);
      return;
    }
    
    console.log('Found challenge to join:', challengeToJoin);
    
    try {
      // Update local state immediately for responsiveness
      const updatedUserChallenges = [...userChallenges, challengeToJoin];
      setUserChallenges(updatedUserChallenges);
      
      // Remove from available challenges
      const updatedAvailableChallenges = availableChallenges.filter(c => c.id !== challengeId);
      setAvailableChallenges(updatedAvailableChallenges);
      
      // Save to localStorage for persistence
      localStorage.setItem('userChallenges', JSON.stringify(updatedUserChallenges));
      
      // Try to save to backend (can ignore failures)
      fetch('http://127.0.0.1:8000/api/challenges/join/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ challenge_id: challengeId }),
      }).catch(err => console.warn('Backend sync failed, but local changes saved:', err));
      
      // Show notification
      showNotification(`Joined the "${challengeToJoin.name}" challenge!`, true);
      
      // Switch to active tab to show the joined challenge
      setActiveTab('active');
      
      // Dispatch storage event for other components
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error('Error in join challenge process:', error);
      showNotification('Error joining challenge. Please try again.', false);
    } finally {
      setLoading(false);
    }
  };

  const handleQuitChallenge = (challengeId) => {
    console.log('Quitting challenge with ID:', challengeId);
    
    // Find the challenge
    const challenge = userChallenges.find(c => c.id === challengeId);
    
    if (!challenge) {
      console.error('Could not find challenge with ID:', challengeId);
      return;
    }
    
    console.log('Found challenge to quit:', challenge);
    
    try {
      // Update user challenges
      const newUserChallenges = userChallenges.filter(c => c.id !== challengeId);
      setUserChallenges(newUserChallenges);
      localStorage.setItem('userChallenges', JSON.stringify(newUserChallenges));
      
      // Add to available challenges if not already there
      const isAlreadyAvailable = availableChallenges.some(c => 
        c.id === challenge.id || c.name === challenge.name
      );
      
      if (!isAlreadyAvailable) {
        const newAvailableChallenges = [...availableChallenges, challenge];
        setAvailableChallenges(newAvailableChallenges);
        localStorage.setItem('availableChallenges', JSON.stringify(newAvailableChallenges));
      }
      
      // Show notification
      showNotification(`Quit the "${challenge.name}" challenge`, false);
      
      // If this was the last challenge and user is on 'active' tab, maybe suggest switching
      if (newUserChallenges.length === 0 && activeTab === 'active') {
        setTimeout(() => {
          showNotification("No active challenges. Check available challenges to join new ones!", true);
        }, 2000);
      }
    } catch (error) {
      console.error('Error in quit challenge:', error);
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
  } else if (activeTab === 'completed') {
    return completedChallenges;
  } else if (activeTab === 'available') {
    return availableChallenges;
  } else {
    return []; // 'expired' tab
  }
};

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
      <Navigation />
      
      {/* Gamification Notification */}
      {notification.show && (
        <div className={`gamification-notification ${notification.show ? 'animate-in' : 'animate-out'} ${theme === 'dark' ? 'dark-notification' : ''}`}>
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
              <p style={{ fontSize: '0.875rem', fontWeight: 500, color: theme === 'dark' ? '#e2e8f0' : '#111827' }}>{notification.message}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className={`challenges-container ${theme === 'dark' ? 'dark-mode' : ''}`}>
        <h1 className={`challenges-title ${theme === 'dark' ? 'dark-title' : ''}`}>Reading Challenges</h1>
        
        <div className="level-badge-container">
          <div className={`level-badge ${theme === 'dark' ? 'dark-level-badge' : ''}`}>
            <span className="level-label">Level</span>
            <span className="level-value">1</span>
            <span className="points-value">0 PTS</span>
          </div>
        </div>
        
        <div className={`tab-buttons ${theme === 'dark' ? 'dark-tabs' : ''}`}>
          <button
            onClick={() => setActiveTab('active')}
            className={`tab-button ${activeTab === 'active' ? 'active' : ''} ${theme === 'dark' ? 'dark-tab' : ''}`}
          >
            Active Challenges
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`tab-button ${activeTab === 'completed' ? 'active' : ''} ${theme === 'dark' ? 'dark-tab' : ''}`}
          >
            Completed
          </button>
          <button
            onClick={() => setActiveTab('expired')}
            className={`tab-button ${activeTab === 'expired' ? 'active' : ''} ${theme === 'dark' ? 'dark-tab' : ''}`}
          >
            Expired
          </button>
          <button
            onClick={() => setActiveTab('available')}
            className={`tab-button ${activeTab === 'available' ? 'active' : ''} ${theme === 'dark' ? 'dark-tab' : ''}`}
          >
            Available Challenges
          </button>
        </div>
        
        <div>
          <button
            onClick={handleCreateChallenge}
            className={`create-challenge-btn ${theme === 'dark' ? 'dark-button' : ''}`}
          >
            Create New Challenge
          </button>
        </div>
        
        {loading ? (
          <div className={`loading-state ${theme === 'dark' ? 'dark-text' : ''}`}>
            <p>Loading challenges...</p>
          </div>
        ) : (
          <div>
            {getFilteredChallenges().length > 0 ? (
              getFilteredChallenges().map(challenge => (
                <div key={challenge.id} className={`challenge-card ${theme === 'dark' ? 'dark-card' : ''}`}>
                  <h2 className={`challenge-title ${theme === 'dark' ? 'dark-title' : ''}`}>{challenge.name}</h2>
                  <p className={`challenge-description ${theme === 'dark' ? 'dark-description' : ''}`}>{challenge.description}</p>
                  
                  <div className="challenge-stats">
                    <div className="challenge-stat">
                      <span className={`stat-label ${theme === 'dark' ? 'dark-label' : ''}`}>Goal</span>
                      <span className={`stat-value ${theme === 'dark' ? 'dark-value' : ''}`}>Read {challenge.target_books} books</span>
                    </div>
                    
                    {activeTab === 'active' && (
                      <div className="progress-container">
                        <div className={`progress-labels ${theme === 'dark' ? 'dark-progress-labels' : ''}`}>
                          <span>Progress: {challenge.books_read} / {challenge.target_books} books</span>
                          <span>{challenge.progress_percentage}%</span>
                        </div>
                        <div className={`progress-bar ${theme === 'dark' ? 'dark-progress-bar' : ''}`}>
                          <div 
                            className={`progress-fill progress-fill-blue ${theme === 'dark' ? 'dark-progress-fill' : ''}`}
                            style={{ width: `${challenge.progress_percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className={`challenge-dates ${theme === 'dark' ? 'dark-dates' : ''}`}>
                    <div>
                      <span className={`date-label ${theme === 'dark' ? 'dark-label' : ''}`}>Starts:</span> {challenge.start_date}
                    </div>
                    <div>
                      <span className={`date-label ${theme === 'dark' ? 'dark-label' : ''}`}>Ends:</span> {challenge.end_date}
                    </div>
                    <div className={`days-remaining ${theme === 'dark' ? 'dark-days-remaining' : ''}`}>
                      {challenge.days_remaining} days remaining
                    </div>
                  </div>
                  
                  <div className="challenge-action">
                    {activeTab === 'available' && (
                      <button 
                        onClick={() => handleJoinChallenge(challenge.id)}
                        className={`join-button ${theme === 'dark' ? 'dark-join-button' : ''}`}
                      >
                        Join Challenge
                      </button>
                    )}
                    
                    {activeTab === 'active' && (
                      <button 
                        onClick={() => handleQuitChallenge(challenge.id)}
                        className={`quit-button ${theme === 'dark' ? 'dark-quit-button' : ''}`}
                      >
                        Quit Challenge
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className={`empty-state ${theme === 'dark' ? 'dark-empty-state' : ''}`}>
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