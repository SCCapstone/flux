import React, { useState, useEffect, useContext } from 'react';
import { useCallback } from 'react';
import { AuthContext } from '../AuthContext';
import { ThemeContext } from '../ThemeContext';
import Navigation from './Navigation';
import ChallengeForm from './ChallengeForm';
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
      progress_percentage: 0,
      is_genre_specific: false,
      genre: ''
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
      progress_percentage: 0,
      is_genre_specific: false,
      genre: ''
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
      progress_percentage: 0,
      is_genre_specific: true,
      genre: 'classics'
    },
    {
      id: 'sample4',
      name: 'Fantasy Adventures',
      description: 'Explore magical worlds and epic quests',
      target_books: 6,
      books_read: 0,
      start_date: '2025-01-15',
      end_date: '2025-07-15',
      days_remaining: 180,
      progress_percentage: 0,
      is_genre_specific: true,
      genre: 'fantasy'
    }
  ];

  const [userChallenges, setUserChallenges] = useState([]);
  const [availableChallenges, setAvailableChallenges] = useState(sampleAvailableChallenges);
  const [completedChallenges, setCompletedChallenges] = useState([]);
  
  // Form state
  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [challengeToEdit, setChallengeToEdit] = useState(null);
  
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

  // Helper function to get book genre
  function getBookGenre(bookId) {
    try {
      // Try to find the book in favorites
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      const book = favorites.find(b => b.google_books_id === bookId);
      
      if (book && book.genre) {
        return book.genre;
      }
      
      return null;
    } catch (e) {
      console.warn('Error getting book genre:', e);
      return null;
    }
  }

  // Helper function to check if a book is classic literature
  function isClassicLiterature(genre) {
    if (!genre) return false;
    
    // Check for various ways classics might be categorized
    const classicsKeywords = [
      'classic', 
      'literature', 
      'literary fiction', 
      'classics'
    ];
    
    // Check if any of the keywords are in the genre
    return classicsKeywords.some(keyword => 
      genre.toLowerCase().includes(keyword.toLowerCase())
    );
  }

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
      let storedCompletedChallenges = [];
      try {
        const completedChallengesData = localStorage.getItem('completedChallenges');
        if (completedChallengesData) {
          storedCompletedChallenges = JSON.parse(completedChallengesData);
          setCompletedChallenges(storedCompletedChallenges);
        }
      } catch (e) {
        console.warn('Error loading completed challenges:', e);
      }
      
      if (localUserChallenges.length === 0 && storedCompletedChallenges.length === 0) {
        console.log('New user detected, showing sample challenges');
        // Force initialize sample challenges for new users
        setAvailableChallenges(sampleAvailableChallenges);
        
        // Save to localStorage to ensure persistence
        localStorage.setItem('availableChallenges', JSON.stringify(sampleAvailableChallenges));
        
        setLoading(false);
        return; 
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
      
      // For new users with no active or completed challenges, ensure sample challenges are shown
      if (localUserChallenges.length === 0 && storedCompletedChallenges.length === 0) {
        setAvailableChallenges(sampleAvailableChallenges);
        console.log('New user detected, showing sample challenges');
        setLoading(false);
        return; // Skip the filtering for new users
      }
      
      // Filter out challenges that the user is already participating in
      const activeAndCompletedNames = new Set([
        ...localUserChallenges.map(c => c.name),
        ...storedCompletedChallenges.map(c => c.name)
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
    const initializeForNewUser = () => {
      console.log('Initializing challenges for new user');
      
      // Save sample challenges to localStorage for new users
      localStorage.setItem('availableChallenges', JSON.stringify(sampleAvailableChallenges));
      
      // Explicitly set state and mark as initialized
      setAvailableChallenges(sampleAvailableChallenges);
      localStorage.setItem('challengesInitialized', 'true');
      
      setLoading(false);
    };
    
    const loadChallenges = async () => {
      // Check if this is a new user (no challenges in localStorage)
      const hasUserChallenges = localStorage.getItem('userChallenges');
      const hasCompletedChallenges = localStorage.getItem('completedChallenges');
      const hasAvailableChallenges = localStorage.getItem('availableChallenges');
      
      // If new user, initialize with sample challenges
      if (!hasUserChallenges && !hasCompletedChallenges && !hasAvailableChallenges) {
        console.log('NEW USER DETECTED - initializing with sample challenges');
        initializeForNewUser();
        return; // Skip regular loading for new users
      }
      
      // Otherwise proceed with normal loading
      if (user?.token) {
        fetchChallenges();
      } else {
        // Fallback to sample data if no user is logged in
        setAvailableChallenges(sampleAvailableChallenges);
      }
    };
    
    // Execute the loading function
    loadChallenges();
    
  }, [user?.token]); 

  // Check for completed challenges on component mount
  useEffect(() => {
    // Check challenge status on component mount
    const checkCompletedChallenges = () => {
      try {
        // Get user challenges
        const storedChallenges = localStorage.getItem('userChallenges');
        if (!storedChallenges) return;
        
        const challenges = JSON.parse(storedChallenges);
        
        // Get existing completed challenges
        const storedCompletedChallenges = localStorage.getItem('completedChallenges') || '[]';
        const existingCompleted = JSON.parse(storedCompletedChallenges);
        
        // Check which challenges are completed (100% progress)
        const active = [];
        const newCompleted = [];
        
        challenges.forEach(challenge => {
          // Cap books_read at target value
          const booksRead = Math.min(challenge.books_read, challenge.target_books);
          const progress_percentage = Math.min(
            Math.round((booksRead / challenge.target_books) * 100), 
            100
          );
          
          const updatedChallenge = {
            ...challenge,
            books_read: booksRead,
            progress_percentage
          };
          
          // Move to appropriate list
          if (progress_percentage >= 100) {
            newCompleted.push(updatedChallenge);
          } else {
            active.push(updatedChallenge);
          }
        });
        
        // Check if we have any changes to make
        if (active.length !== challenges.length) {
          console.log('Moving completed challenges to completed tab');
          
          // Combine with existing completed challenges (avoid duplicates)
          const existingIds = new Set(existingCompleted.map(c => c.id));
          const uniqueNewCompleted = newCompleted.filter(c => !existingIds.has(c.id));
          const allCompleted = [...existingCompleted, ...uniqueNewCompleted];
          
          // Update state and localStorage
          setUserChallenges(active);
          setCompletedChallenges(allCompleted);
          
          localStorage.setItem('userChallenges', JSON.stringify(active));
          localStorage.setItem('completedChallenges', JSON.stringify(allCompleted));
        }
      } catch (error) {
        console.error('Error checking completed challenges:', error);
      }
    };
    
    // Run when component mounts
    checkCompletedChallenges();
    
    // Also set up an interval to periodically check (every 30 seconds)
    const intervalId = setInterval(checkCompletedChallenges, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    // Special check for first-time users
    const isFirstTimeUser = !localStorage.getItem('userChallenges') && 
                            !localStorage.getItem('completedChallenges');
    
    if (isFirstTimeUser) {
      console.log('First time user detected, initializing sample challenges');
      // Force set the sample challenges for brand new users
      setAvailableChallenges(sampleAvailableChallenges);
      localStorage.setItem('initialChallengesLoaded', 'true');
    }
  }, []);

  // Listen for finishedBookAdded event
  useEffect(() => {
    const handleFinishedBookAdded = (event) => {
      console.log('Finished book added event detected:', event.detail);
      
      try {
        // Get the book data from the event
        const bookData = event.detail?.book;
        if (!bookData) {
          console.warn('No book data in the event');
          return;
        }
        
        // Get current challenges
        const storedChallenges = localStorage.getItem('userChallenges');
        if (!storedChallenges) return;
        
        const challenges = JSON.parse(storedChallenges);
        
        // Get existing finished books for tracking
        let finishedBooksMap = {};
        try {
          const storedMap = localStorage.getItem('challengeBookMap');
          if (storedMap) {
            finishedBooksMap = JSON.parse(storedMap);
          }
        } catch (e) {
          console.warn('Error loading challenge book map:', e);
          finishedBooksMap = {};
        }
        
        // Try to get book genre information
        const bookGenre = getBookGenre(bookData);
        
        // Process each challenge separately
        const active = [];
        const completed = [];
        
        challenges.forEach(challenge => {
          // Initialize tracking for this challenge if needed
          if (!finishedBooksMap[challenge.id]) {
            finishedBooksMap[challenge.id] = {
              bookIds: [],
              genres: new Set(),
              classicsCount: 0,
              challengeName: challenge.name,
              isGenreSpecific: challenge.is_genre_specific,
              targetGenre: challenge.genre
            };
          }
          
          const challengeTracker = finishedBooksMap[challenge.id];
          
          // Check if we need to add this book to the challenge
          let updateNeeded = false;
          
          // Only add the book if:
          // 1. It's a new book (not already counted)
          // 2. The challenge is active (current date is between start and end dates)
          // 3. If it's genre-specific, the book must match the target genre
          const now = new Date();
          const startDate = new Date(challenge.start_date);
          const endDate = new Date(challenge.end_date);
          const isActive = now >= startDate && now <= endDate;
          
          // Check if book meets genre requirements for this challenge
          const meetsGenreRequirement = !challengeTracker.isGenreSpecific || 
            (bookGenre && bookGenre.toLowerCase().includes(challengeTracker.targetGenre.toLowerCase()));
          
          if (isActive && bookData && !challengeTracker.bookIds.includes(bookData) && meetsGenreRequirement) {
            challengeTracker.bookIds.push(bookData);
            
            // Track genre for Genre Explorer
            if (challenge.name === 'Genre Explorer' && bookGenre) {
              challengeTracker.genres.add(bookGenre);
            }
            
            // Track classics for Classics Marathon
            if (challenge.name === 'Classics Marathon' && isClassicLiterature(bookGenre)) {
              challengeTracker.classicsCount++;
            }
            
            updateNeeded = true;
          }
          
          // Calculate progress based on challenge type
          let booksRead = 0;
          if (challenge.name === 'Genre Explorer') {
            // For Genre Explorer, count unique genres
            booksRead = challengeTracker.genres.size;
          } else if (challenge.name === 'Classics Marathon') {
            // For Classics Marathon, count classic books
            booksRead = challengeTracker.classicsCount;
          } else {
            // For other challenges like Summer Reading, count all books that meet requirements
            booksRead = challengeTracker.bookIds.length;
          }
          
          // Cap at target and calculate percentage
          booksRead = Math.min(booksRead, challenge.target_books);
          const progress_percentage = Math.round((booksRead / challenge.target_books) * 100);
          
          // Update challenge with progress
          const updatedChallenge = {
            ...challenge,
            books_read: booksRead,
            progress_percentage
          };
          
          // Move to completed if 100%
          if (progress_percentage >= 100) {
            completed.push(updatedChallenge);
          } else {
            active.push(updatedChallenge);
          }
        });
        
        // Save updated book mapping
        localStorage.setItem('challengeBookMap', JSON.stringify(finishedBooksMap));
        
        // Get existing completed challenges
        let existingCompleted = [];
        try {
          const completedData = localStorage.getItem('completedChallenges');
          if (completedData) {
            existingCompleted = JSON.parse(completedData);
          }
        } catch (e) {
          console.warn('Error loading completed challenges:', e);
        }
        
        // Combine with existing completed challenges
        const existingCompletedIds = existingCompleted.map(c => c.id);
        const newCompleted = completed.filter(c => !existingCompletedIds.includes(c.id));
        const allCompleted = [...existingCompleted, ...newCompleted];
        
        // Update state
        setUserChallenges(active);
        setCompletedChallenges(allCompleted);
        
        // Save to localStorage
        localStorage.setItem('userChallenges', JSON.stringify(active));
        localStorage.setItem('completedChallenges', JSON.stringify(allCompleted));
        
        console.log('Updated challenge progress after finishing book');
      } catch (error) {
        console.error('Error updating challenges after book finish:', error);
      }
    };
    
    window.addEventListener('finishedBookAdded', handleFinishedBookAdded);
    
    return () => {
      window.removeEventListener('finishedBookAdded', handleFinishedBookAdded);
    };
  }, []);

  // Listen for general storage changes
  useEffect(() => {
    const handleStorageChange = () => {
      console.log('Storage changed, refreshing challenges');
      fetchChallenges();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
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
      // Reset challenge to 0 progress before joining
      const freshChallenge = {
        ...challengeToJoin,
        books_read: 0,
        progress_percentage: 0
      };
      
      // Update local state immediately for responsiveness
      const updatedUserChallenges = [...userChallenges, freshChallenge];
      setUserChallenges(updatedUserChallenges);
      
      // Remove from available challenges
      const updatedAvailableChallenges = availableChallenges.filter(c => c.id !== challengeId);
      setAvailableChallenges(updatedAvailableChallenges);
      
      // Save to localStorage for persistence
      localStorage.setItem('userChallenges', JSON.stringify(updatedUserChallenges));
      
      // Initialize challenge tracking for this challenge
      let challengeBookMap = {};
      try {
        const storedMap = localStorage.getItem('challengeBookMap');
        if (storedMap) {
          challengeBookMap = JSON.parse(storedMap);
        }
        
        // Initialize tracking for this new challenge
        challengeBookMap[challengeId] = {
          bookIds: [],
          genres: new Set(),
          classicsCount: 0,
          challengeName: freshChallenge.name,
          isGenreSpecific: freshChallenge.is_genre_specific,
          targetGenre: freshChallenge.genre
        };
        
        // Save updated challenge tracking
        localStorage.setItem('challengeBookMap', JSON.stringify(challengeBookMap));
      } catch (e) {
        console.warn('Error initializing challenge tracking:', e);
      }
      
      // Try to save to backend (can ignore failures)
      fetch(`${apiBaseUrl}/challenges/join/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ challenge_id: challengeId }),
      }).catch(err => console.warn('Backend sync failed, but local changes saved:', err));
      
      // Show notification
      showNotification(`Joined the "${freshChallenge.name}" challenge!`, true);
      
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
      
      // Reset the challenge to its original state
      const resetChallenge = {
        ...challenge,
        books_read: 0,
        progress_percentage: 0
      };
      
      // Add to available challenges if not already there
      const isAlreadyAvailable = availableChallenges.some(c => 
        c.id === challenge.id || c.name === challenge.name
      );
      
      if (!isAlreadyAvailable) {
        const newAvailableChallenges = [...availableChallenges, resetChallenge];
        setAvailableChallenges(newAvailableChallenges);
        localStorage.setItem('availableChallenges', JSON.stringify(newAvailableChallenges));
      }
      
      // IMPORTANT: Completely remove challenge tracking data
      try {
        const storedMap = localStorage.getItem('challengeBookMap');
        if (storedMap) {
          const challengeBookMap = JSON.parse(storedMap);
          
          // Delete this challenge's tracking data
          delete challengeBookMap[challengeId];
          
          // Also check for challenges with the same name
          // This is key for the Summer Reading Challenge
          Object.keys(challengeBookMap).forEach(key => {
            const trackerData = challengeBookMap[key];
            if (trackerData && trackerData.challengeName === challenge.name) {
              delete challengeBookMap[key];
            }
          });
          
          localStorage.setItem('challengeBookMap', JSON.stringify(challengeBookMap));
          console.log('Completely removed challenge tracking data');
        }
      } catch (e) {
        console.warn('Error removing challenge from book map:', e);
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
    // Show the form instead of creating a default challenge
    setShowChallengeForm(true);
    setChallengeToEdit(null); // No challenge to edit, creating new
  };
  
  // Add new function to handle editing existing challenges
  const handleEditChallenge = (challengeId) => {
    const challenge = userChallenges.find(c => c.id === challengeId);
    if (challenge) {
      setChallengeToEdit(challenge);
      setShowChallengeForm(true);
    }
  };
  
  // Add function to handle form submission
  const handleSaveChallenge = (challengeData) => {
    // Check if we're editing or creating
    if (challengeToEdit) {
      // Editing existing challenge
      const updatedUserChallenges = userChallenges.map(c => 
        c.id === challengeData.id ? challengeData : c
      );
      setUserChallenges(updatedUserChallenges);
      localStorage.setItem('userChallenges', JSON.stringify(updatedUserChallenges));
      
      // Update challenge tracking data with new genre settings if changed
      try {
        const storedMap = localStorage.getItem('challengeBookMap') || '{}';
        const challengeBookMap = JSON.parse(storedMap);
        
        if (challengeBookMap[challengeData.id]) {
          challengeBookMap[challengeData.id].challengeName = challengeData.name;
          challengeBookMap[challengeData.id].isGenreSpecific = challengeData.is_genre_specific;
          challengeBookMap[challengeData.id].targetGenre = challengeData.genre;
          
          localStorage.setItem('challengeBookMap', JSON.stringify(challengeBookMap));
        }
      } catch (e) {
        console.warn('Error updating challenge tracking data:', e);
      }
      
      showNotification(`Updated "${challengeData.name}" challenge!`, true);
    } else {
      // Creating new challenge
      // Add to user challenges
      setUserChallenges(prev => [...prev, challengeData]);
      
      // Initialize challenge tracking
      try {
        const storedMap = localStorage.getItem('challengeBookMap') || '{}';
        const challengeBookMap = JSON.parse(storedMap);
        
        // Initialize tracking for this new challenge
        challengeBookMap[challengeData.id] = {
          bookIds: [],
          genres: new Set(),
          classicsCount: 0,
          challengeName: challengeData.name,
          isGenreSpecific: challengeData.is_genre_specific,
          targetGenre: challengeData.genre
        };
        
        localStorage.setItem('challengeBookMap', JSON.stringify(challengeBookMap));
      } catch (e) {
        console.warn('Error initializing challenge tracking:', e);
      }
      
      // Save to localStorage
      localStorage.setItem('userChallenges', JSON.stringify([...userChallenges, challengeData]));
      
      // Show notification
      showNotification(`Created "${challengeData.name}" challenge!`, true);
    }
    
    // Close the form
    setShowChallengeForm(false);
    setChallengeToEdit(null);
    
    // Switch to active tab
    setActiveTab('active');
  };
  
  // Add function to handle form cancellation
  const handleCancelForm = () => {
    setShowChallengeForm(false);
    setChallengeToEdit(null);
  };

  const handleFixProgressBar = () => {
    try {
      // Get challenge book map
      const storedMap = localStorage.getItem('challengeBookMap') || '{}';
      const challengeBookMap = JSON.parse(storedMap);
      
      // Get current challenges
      const storedChallenges = localStorage.getItem('userChallenges');
      if (!storedChallenges) {
        console.warn('No challenges found');
        return;
      }
      
      const challenges = JSON.parse(storedChallenges);
      
      // Process challenges
      const active = [];
      const completed = [];
      
      challenges.forEach(challenge => {
        // Get or initialize tracking for this challenge
        if (!challengeBookMap[challenge.id]) {
          challengeBookMap[challenge.id] = {
            bookIds: [],
            genres: new Set(),
            classicsCount: 0
          };
        }
        
        const tracker = challengeBookMap[challenge.id];
        
        // Calculate progress based on challenge type
        let booksRead = 0;
        if (challenge.name === 'Genre Explorer') {
          booksRead = typeof tracker.genres.size === 'number' ? tracker.genres.size : 0;
        } else if (challenge.name === 'Classics Marathon') {
          booksRead = tracker.classicsCount || 0;
        } else {
          booksRead = tracker.bookIds ? tracker.bookIds.length : 0;
        }
        
        // Force a minimum book count for testing
        if (booksRead === 0) {
          if (challenge.name === 'Summer Reading Challenge') {
            booksRead = 5; // Half of the target
          } else {
            booksRead = 2; // Small number for testing
          }
        }
        
        // Cap at target and calculate percentage
        booksRead = Math.min(booksRead, challenge.target_books);
        const progress_percentage = Math.round((booksRead / challenge.target_books) * 100);
        
        // Update challenge
        const updatedChallenge = {
          ...challenge,
          books_read: booksRead,
          progress_percentage
        };
        
        // Add to appropriate list
        if (progress_percentage >= 100) {
          completed.push(updatedChallenge);
        } else {
          active.push(updatedChallenge);
        }
      });
      
      // Get existing completed challenges
      const storedCompletedChallenges = localStorage.getItem('completedChallenges') || '[]';
      const existingCompleted = JSON.parse(storedCompletedChallenges);
      
      // Combine with existing completed challenges
      const existingCompletedIds = existingCompleted.map(c => c.id);
      const newCompleted = completed.filter(c => !existingCompletedIds.includes(c.id));
      const allCompleted = [...existingCompleted, ...newCompleted];
      
      // Update state and localStorage
      setUserChallenges(active);
      setCompletedChallenges(allCompleted);
      
      localStorage.setItem('userChallenges', JSON.stringify(active));
      localStorage.setItem('completedChallenges', JSON.stringify(allCompleted));
      localStorage.setItem('challengeBookMap', JSON.stringify(challengeBookMap));
      
      alert('Progress bars updated and completed challenges moved to Completed tab');
      window.location.reload();
    } catch (e) {
      console.error('Error fixing progress bar:', e);
      alert('Error: ' + e.message);
    }
  };

  const forceReloadChallenges = useCallback(() => {
    // Force reset all challenges state for debugging/recovery
    try {
      // Clear any existing challenges
      localStorage.removeItem('userChallenges');
      localStorage.removeItem('completedChallenges');
      
      // Force set available challenges to sample challenges
      setAvailableChallenges(sampleAvailableChallenges);
      localStorage.setItem('availableChallenges', JSON.stringify(sampleAvailableChallenges));
      
      // Mark as refreshed
      console.log('FORCE REFRESHED: Challenges reset to initial state');
      
      // Reload the page to ensure clean state
      window.location.reload();
    } catch (e) {
      console.error('Error during force refresh:', e);
      alert('Error refreshing challenges: ' + e.message);
    }
  }, []);

  // Reset available challenges for new users
  const handleResetAvailableChallenges = () => {
    try {
      // Force reset available challenges to sample challenges
      setAvailableChallenges(sampleAvailableChallenges);
      
      // Save to localStorage to ensure they persist
      localStorage.setItem('availableChallenges', JSON.stringify(sampleAvailableChallenges));
      localStorage.setItem('availableChallengesReset', 'true');
      
      // Show clear feedback
      alert('Available challenges have been reset successfully. The page will refresh.');
      window.location.reload();
    } catch (e) {
      console.error('Error resetting available challenges:', e);
      alert('Error resetting challenges: ' + e.message);
    }
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
      
      {/* Challenge Form Modal */}
{showChallengeForm && (
  <div className="modal-overlay" onClick={(e) => {
    // Close modal when clicking outside the form
    if (e.target.className === 'modal-overlay') {
      handleCancelForm();
    }
  }}>
    <div className="modal-container">
      <ChallengeForm 
        challenge={challengeToEdit}
        onSave={handleSaveChallenge}
        onCancel={handleCancelForm}
        isEditing={!!challengeToEdit}
      />
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
                    
                    {/* Add genre badge if challenge is genre-specific */}
                    {challenge.is_genre_specific && (
                      <div className="genre-badge">
                        <span className="genre-label">Genre:</span>
                        <span className="genre-value">{challenge.genre}</span>
                      </div>
                    )}
                    
                    {(activeTab === 'active' || activeTab === 'completed') && (
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
                      <>
                        <button 
                          onClick={() => handleEditChallenge(challenge.id)}
                          className={`edit-button ${theme === 'dark' ? 'dark-edit-button' : ''}`}
                        >
                          Edit Challenge
                        </button>
                        <button 
                          onClick={() => handleQuitChallenge(challenge.id)}
                          className={`quit-button ${theme === 'dark' ? 'dark-quit-button' : ''}`}
                        >
                          Quit Challenge
                        </button>
                      </>
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