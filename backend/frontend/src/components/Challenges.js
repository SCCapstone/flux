import React, { useState, useEffect, useContext } from 'react';
import { useCallback } from 'react';
import { AuthContext } from '../AuthContext';
import { ThemeContext } from '../ThemeContext';
import Navigation from './Navigation';
import ChallengeForm from './ChallengeForm';
import '../styles/Challenges.css';

const Challenges = () => {
  const { user, userPoints, userLevel } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const [activeTab, setActiveTab] = useState('available');
  const [loading, setLoading] = useState(false);
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
  
  // Get today's date for validation
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset to start of day for accurate comparisons

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
  const [pendingChallenges, setPendingChallenges] = useState([]); // New state for challenges that have been joined but not started
  const [availableChallenges, setAvailableChallenges] = useState(sampleAvailableChallenges);
  const [completedChallenges, setCompletedChallenges] = useState([]);
  const [expiredChallenges, setExpiredChallenges] = useState([]); // Added state for expired challenges
  
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

  // IMPROVED HELPER FUNCTIONS FOR GENRE MATCHING

  function normalizeGenre(raw) {
    if (!raw) return '';
    return raw.toLowerCase().replace(/[^a-z0-9&]+/g, ' ').trim(); // e.g., "Biography & Autobiography" -> "biography autobiography"
  }
  
  function getBookGenre(bookId) {
    try {
      const sources = [
        JSON.parse(localStorage.getItem('favorites') || '[]'),
        JSON.parse(localStorage.getItem('finishedBooks') || '[]'),
        JSON.parse(localStorage.getItem('readingList') || '[]'),
      ];
  
      for (const list of sources) {
        const book = list.find(b => b.id === bookId || b.google_books_id === bookId);
        if (book?.genre) return normalizeGenre(book.genre);
        if (book?.categories?.length) return normalizeGenre(book.categories[0]);
      }
  
      return null;
    } catch (e) {
      console.warn('Error getting book genre:', e);
      return null;
    }
  }

  // Improved genre matching function
  function genreMatches(bookGenre, targetGenre) {
    if (!bookGenre || !targetGenre) return false;
  
    const normalizedBook = normalizeGenre(bookGenre);
    const normalizedTarget = normalizeGenre(targetGenre);
  
    if (normalizedBook === normalizedTarget) return true;
  
    // Token matching
    const bookTokens = normalizedBook.split(' ');
    const targetTokens = normalizedTarget.split(' ');
    if (targetTokens.every(token => bookTokens.includes(token))) return true;
  
    // Canonical genre variations
    const genreAliases = {
      'non-fiction': ['nonfiction', 'non fiction', 'biography', 'autobiography', 'memoir', 'business economics', 'history'],
      'fantasy': ['fantasy', 'epic fantasy', 'high fantasy', 'urban fantasy'],
      'science fiction': ['sci fi', 'science fiction', 'scifi', 'sci-fi'],
      'young adult': ['young adult', 'ya', 'teen'],
      'classics': ['classic', 'classics', 'classic literature', 'literary classics'],
    };
  
    for (const [canonical, variants] of Object.entries(genreAliases)) {
      if (variants.some(v => normalizedBook.includes(v)) && variants.some(v => normalizedTarget.includes(v))) {
        return true;
      }
    }
  
    return false;
  }
  
  // Helper function to check if a book is classic literature
  function isClassicLiterature(genre) {
    if (!genre) return false;
    
    // Use the improved genre matching function
    return genreMatches(genre, 'classics');
  }

  // Date validation helper functions
  const isDateInPast = (dateString) => {
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0); // Reset to start of day for accurate comparison
    return date < today;
  };
  
  const isDateInFuture = (dateString) => {
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0); // Reset to start of day for accurate comparison
    return date > today;
  };
  
  const isEndDateAfterStartDate = (startDateString, endDateString) => {
    const startDate = new Date(startDateString);
    const endDate = new Date(endDateString);
    return endDate > startDate;
  };
  
  const validateChallengeDates = (challenge, isNewChallenge = false) => {
    const errors = {};
    
    // For new challenges, start date must not be in the past
    if (isNewChallenge && isDateInPast(challenge.start_date)) {
      errors.start_date = 'Start date cannot be in the past for new challenges';
    }
    
    // End date must not be in the past
    if (isDateInPast(challenge.end_date)) {
      errors.end_date = 'End date cannot be in the past';
    }
    
    // End date must be after start date
    if (!isEndDateAfterStartDate(challenge.start_date, challenge.end_date)) {
      errors.end_date = 'End date must be after start date';
    }
    
    return errors;
  };

  // Function to categorize challenges based on date
  const categorizeChallenges = useCallback((challenges) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset to start of day for accurate comparisons
    
    const active = [];
    const pending = [];
    const expired = [];
    const completed = [];

    challenges.forEach(challenge => {
      const startDate = new Date(challenge.start_date);
      const endDate = new Date(challenge.end_date);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      if (challenge.progress_percentage >= 100) {
        completed.push(challenge);
      } else if (now > endDate) {
        expired.push(challenge);
      } else if (now < startDate) {
        pending.push(challenge);
      } else {
        active.push(challenge);
      }
    });

    return { active, pending, expired, completed };
  }, []);

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
      
      // Get pending challenges
      let storedPendingChallenges = [];
      try {
        const pendingChallengesData = localStorage.getItem('pendingChallenges');
        if (pendingChallengesData) {
          storedPendingChallenges = JSON.parse(pendingChallengesData);
        }
      } catch (e) {
        console.warn('Error loading pending challenges:', e);
      }
      
      // Get completed challenges if they exist
      let storedCompletedChallenges = [];
      try {
        const completedChallengesData = localStorage.getItem('completedChallenges');
        if (completedChallengesData) {
          storedCompletedChallenges = JSON.parse(completedChallengesData);
        }
      } catch (e) {
        console.warn('Error loading completed challenges:', e);
      }
      
      // Get expired challenges if they exist
      let storedExpiredChallenges = [];
      try {
        const expiredChallengesData = localStorage.getItem('expiredChallenges');
        if (expiredChallengesData) {
          storedExpiredChallenges = JSON.parse(expiredChallengesData);
        }
      } catch (e) {
        console.warn('Error loading expired challenges:', e);
      }
      
      // Categorize challenges by date
      const { active, pending, expired, completed } = categorizeChallenges([
        ...localUserChallenges,
        ...storedPendingChallenges
      ]);
      
      // Combine with stored completed and expired challenges
      const allCompleted = [...completed, ...storedCompletedChallenges];
      const allExpired = [...expired, ...storedExpiredChallenges];
      
      // Update state with categorized challenges
      setUserChallenges(active);
      setPendingChallenges(pending);
      setCompletedChallenges(allCompleted);
      setExpiredChallenges(allExpired);
      
      // Update localStorage with new categorizations
      localStorage.setItem('userChallenges', JSON.stringify(active));
      localStorage.setItem('pendingChallenges', JSON.stringify(pending));
      localStorage.setItem('completedChallenges', JSON.stringify(allCompleted));
      localStorage.setItem('expiredChallenges', JSON.stringify(allExpired));
      
      if (localUserChallenges.length === 0 && 
          storedPendingChallenges.length === 0 && 
          storedCompletedChallenges.length === 0 && 
          storedExpiredChallenges.length === 0) {
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
      if (active.length === 0 && 
          pending.length === 0 && 
          allCompleted.length === 0 && 
          allExpired.length === 0) {
        setAvailableChallenges(sampleAvailableChallenges);
        console.log('New user detected, showing sample challenges');
        setLoading(false);
        return; // Skip the filtering for new users
      }
      
      // Filter out challenges that the user is already participating in or has completed
      const activeAndCompletedAndPendingNames = new Set([
        ...active.map(c => c.name),
        ...pending.map(c => c.name),
        ...allCompleted.map(c => c.name),
        ...allExpired.map(c => c.name)
      ]);
      
      const filteredAvailableChallenges = availableChallengesData.filter(
        challenge => !activeAndCompletedAndPendingNames.has(challenge.name)
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
      const hasPendingChallenges = localStorage.getItem('pendingChallenges');
      const hasCompletedChallenges = localStorage.getItem('completedChallenges');
      const hasExpiredChallenges = localStorage.getItem('expiredChallenges');
      const hasAvailableChallenges = localStorage.getItem('availableChallenges');
      
      // If new user, initialize with sample challenges
      if (!hasUserChallenges && 
          !hasPendingChallenges && 
          !hasCompletedChallenges && 
          !hasExpiredChallenges && 
          !hasAvailableChallenges) {
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
    
  }, [user?.token, categorizeChallenges]); 

  // Check for challenge status changes periodically
  useEffect(() => {
    const updateChallengeStatuses = () => {
      try {
        // Get user challenges and pending challenges
        const storedUserChallenges = localStorage.getItem('userChallenges') || '[]';
        const storedPendingChallenges = localStorage.getItem('pendingChallenges') || '[]';
        const storedCompletedChallenges = localStorage.getItem('completedChallenges') || '[]';
        const storedExpiredChallenges = localStorage.getItem('expiredChallenges') || '[]';
        
        const userChals = JSON.parse(storedUserChallenges);
        const pendingChals = JSON.parse(storedPendingChallenges);
        const completedChals = JSON.parse(storedCompletedChallenges);
        const expiredChals = JSON.parse(storedExpiredChallenges);
        
        // Categorize all challenges
        const { active, pending, expired, completed } = categorizeChallenges([
          ...userChals,
          ...pendingChals
        ]);
        
        // Combine with existing completed and expired challenges
        const existingCompletedIds = new Set(completedChals.map(c => c.id));
        const existingExpiredIds = new Set(expiredChals.map(c => c.id));
        
        const newCompleted = completed.filter(c => !existingCompletedIds.has(c.id));
        const newExpired = expired.filter(c => !existingExpiredIds.has(c.id));
        
        const allCompleted = [...completedChals, ...newCompleted];
        const allExpired = [...expiredChals, ...newExpired];
        
        // Check if we have any status changes
        const activeChanged = JSON.stringify(active) !== storedUserChallenges;
        const pendingChanged = JSON.stringify(pending) !== storedPendingChallenges;
        const completedChanged = newCompleted.length > 0;
        const expiredChanged = newExpired.length > 0;
        
        if (activeChanged || pendingChanged || completedChanged || expiredChanged) {
          console.log('Challenge statuses updated');
          
          // Update states
          setUserChallenges(active);
          setPendingChallenges(pending);
          setCompletedChallenges(allCompleted);
          setExpiredChallenges(allExpired);
          
          // Update localStorage
          localStorage.setItem('userChallenges', JSON.stringify(active));
          localStorage.setItem('pendingChallenges', JSON.stringify(pending));
          localStorage.setItem('completedChallenges', JSON.stringify(allCompleted));
          localStorage.setItem('expiredChallenges', JSON.stringify(allExpired));
          
          // Show notifications for status changes
          if (completedChanged) {
            newCompleted.forEach(challenge => {
              showNotification(`Challenge Completed: "${challenge.name}"!`, true);
            });
          }
          
          if (pendingChanged) {
            // Check for challenges that moved from pending to active
            const pendingIds = new Set(pendingChals.map(c => c.id));
            const newlyActive = active.filter(c => pendingIds.has(c.id));
            
            newlyActive.forEach(challenge => {
              showNotification(`Challenge "${challenge.name}" is now active!`, true);
            });
          }
          
          if (expiredChanged) {
            newExpired.forEach(challenge => {
              showNotification(`Challenge "${challenge.name}" has expired.`, false);
            });
          }
        }
      } catch (error) {
        console.error('Error updating challenge statuses:', error);
      }
    };
    
    // Run when component mounts
    updateChallengeStatuses();
    
    // Set up an interval to periodically check (every 30 seconds)
    const intervalId = setInterval(updateChallengeStatuses, 30000);
    
    return () => clearInterval(intervalId);
  }, [categorizeChallenges, showNotification]);

  useEffect(() => {
    // Special check for first-time users
    const isFirstTimeUser = !localStorage.getItem('userChallenges') && 
                            !localStorage.getItem('pendingChallenges') &&
                            !localStorage.getItem('completedChallenges') &&
                            !localStorage.getItem('expiredChallenges');
    
    if (isFirstTimeUser) {
      console.log('First time user detected, initializing sample challenges');
      // Force set the sample challenges for brand new users
      setAvailableChallenges(sampleAvailableChallenges);
      localStorage.setItem('initialChallengesLoaded', 'true');
    }
  }, []);

  // Listen for finishedBookAdded event - UPDATED WITH IMPROVED GENRE MATCHING
  useEffect(() => {
    const handleFinishedBookAdded = (event) => {
      console.log('Finished book added event detected:', event.detail);

      try {
        const bookData = event.detail?.book;
        if (!bookData) {
          console.warn('No book data in the event');
          return;
        }

        const storedChallenges = localStorage.getItem('userChallenges');
        if (!storedChallenges) return;

        const challenges = JSON.parse(storedChallenges);

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

        const bookId = bookData?.id || bookData?.google_books_id;
        const bookGenre = getBookGenre(bookId);
        console.log('Detected book genre:', bookGenre);

        // Only update active challenges
        const now = new Date();
        const activeChallenges = challenges.filter(challenge => {
          const startDate = new Date(challenge.start_date);
          const endDate = new Date(challenge.end_date);
          return now >= startDate && now <= endDate;
        });

        const active = [];
        const completed = [];

        activeChallenges.forEach(challenge => {
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

          const meetsGenreRequirement = !challengeTracker.isGenreSpecific ||
            (bookGenre && genreMatches(bookGenre, challengeTracker.targetGenre));

          console.log(`Checking challenge "${challenge.name}":`, { 
            isGenreSpecific: challengeTracker.isGenreSpecific,
            targetGenre: challengeTracker.targetGenre,
            bookGenre,
            meetsRequirement: meetsGenreRequirement
          });

          if (bookId && !challengeTracker.bookIds.includes(bookId) && meetsGenreRequirement) {
            challengeTracker.bookIds.push(bookId);

            if (challenge.name === 'Genre Explorer' && bookGenre) {
              challengeTracker.genres.add(bookGenre.toLowerCase().trim());
            }

            if (challenge.name === 'Classics Marathon' && genreMatches(bookGenre, 'classics')) {
              challengeTracker.classicsCount++;
            }

            console.log(`Book added to "${challenge.name}" challenge!`);
          }

          let booksRead = 0;
          if (challenge.name === 'Genre Explorer') {
            booksRead = challengeTracker.genres.size;
          } else if (challenge.name === 'Classics Marathon') {
            booksRead = challengeTracker.classicsCount;
          } else {
            booksRead = challengeTracker.bookIds.length;
          }

          booksRead = Math.min(booksRead, challenge.target_books);
          const progress_percentage = Math.round((booksRead / challenge.target_books) * 100);

          const updatedChallenge = { ...challenge, books_read: booksRead, progress_percentage };

          if (progress_percentage >= 100) {
            completed.push(updatedChallenge);
          } else {
            active.push(updatedChallenge);
          }
        });

        localStorage.setItem('challengeBookMap', JSON.stringify(finishedBooksMap));

        // Get inactive challenges to preserve them
        const inactiveChallenges = challenges.filter(challenge => {
          const startDate = new Date(challenge.start_date);
          const endDate = new Date(challenge.end_date);
          return now < startDate || now > endDate;
        });

        // Combine inactive with updated active
        const updatedUserChallenges = [...inactiveChallenges, ...active];

        let existingCompleted = [];
        try {
          const completedData = localStorage.getItem('completedChallenges');
          if (completedData) {
            existingCompleted = JSON.parse(completedData);
          }
        } catch (e) {
          console.warn('Error loading completed challenges:', e);
        }

        const existingCompletedIds = existingCompleted.map(c => c.id);
        const newCompleted = completed.filter(c => !existingCompletedIds.includes(c.id));
        const allCompleted = [...existingCompleted, ...newCompleted];

        setUserChallenges(updatedUserChallenges);
        setCompletedChallenges(allCompleted);

        localStorage.setItem('userChallenges', JSON.stringify(updatedUserChallenges));
        localStorage.setItem('completedChallenges', JSON.stringify(allCompleted));

        if (newCompleted.length > 0) {
          newCompleted.forEach(challenge => {
            showNotification(`Challenge Completed: "${challenge.name}"!`, true);
          });
        }

        console.log('Updated challenge progress after finishing book');
      } catch (error) {
        console.error('Error updating challenges after book finish:', error);
      }
    };

    window.addEventListener('finishedBookAdded', handleFinishedBookAdded);

    return () => {
      window.removeEventListener('finishedBookAdded', handleFinishedBookAdded);
    };
  }, [showNotification]);

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

  // UPDATED: Handle Join Challenge with proper date validation
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
    
    // Validate dates before joining
    const dateErrors = validateChallengeDates(challengeToJoin);
    if (dateErrors.end_date) {
      showNotification(`Cannot join challenge: ${dateErrors.end_date}`, false);
      setLoading(false);
      return;
    }
    
    try {
      // Reset challenge to 0 progress before joining
      const freshChallenge = {
        ...challengeToJoin,
        books_read: 0,
        progress_percentage: 0
      };
      
      const now = new Date();
      const startDate = new Date(freshChallenge.start_date);
      const endDate = new Date(freshChallenge.end_date);
      
      // Determine if the challenge should be active or pending
      if (now >= startDate && now <= endDate) {
        // Challenge is currently active
        const updatedUserChallenges = [...userChallenges, freshChallenge];
        setUserChallenges(updatedUserChallenges);
        localStorage.setItem('userChallenges', JSON.stringify(updatedUserChallenges));
        showNotification(`Joined the "${freshChallenge.name}" challenge!`, true);
      } else if (now < startDate) {
        // Challenge starts in the future
        const updatedPendingChallenges = [...pendingChallenges, freshChallenge];
        setPendingChallenges(updatedPendingChallenges);
        localStorage.setItem('pendingChallenges', JSON.stringify(updatedPendingChallenges));
        
        // Format date for display
        const formattedDate = startDate.toLocaleDateString();
        showNotification(`Joined the "${freshChallenge.name}" challenge! It will activate on ${formattedDate}.`, true);
      } else {
        // Challenge is already expired (should never get here due to earlier validation)
        showNotification(`Cannot join "${freshChallenge.name}" - this challenge has already ended.`, false);
        setLoading(false);
        return;
      }
      
      // Remove from available challenges
      const updatedAvailableChallenges = availableChallenges.filter(c => c.id !== challengeId);
      setAvailableChallenges(updatedAvailableChallenges);
      localStorage.setItem('availableChallenges', JSON.stringify(updatedAvailableChallenges));
      
      // Initialize challenge tracking for this challenge with consistent genre format
      let challengeBookMap = {};
      try {
        const storedMap = localStorage.getItem('challengeBookMap');
        if (storedMap) {
          challengeBookMap = JSON.parse(storedMap);
        }
        
        // Initialize tracking for this new challenge with consistent genre format
        challengeBookMap[challengeId] = {
          bookIds: [],
          genres: new Set(),
          classicsCount: 0,
          challengeName: freshChallenge.name,
          isGenreSpecific: freshChallenge.is_genre_specific,
          targetGenre: freshChallenge.genre ? freshChallenge.genre.toLowerCase() : ''
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
      
      // Switch to appropriate tab based on challenge status
      if (now >= startDate && now <= endDate) {
        setActiveTab('active');
      } else {
        setActiveTab('upcoming');
      }
      
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
    
    // Find the challenge in active or pending challenges
    const activeChallenge = userChallenges.find(c => c.id === challengeId);
    const pendingChallenge = pendingChallenges.find(c => c.id === challengeId);
    const challenge = activeChallenge || pendingChallenge;
    
    if (!challenge) {
      console.error('Could not find challenge with ID:', challengeId);
      return;
    }
    
    console.log('Found challenge to quit:', challenge);
    
    try {
      // Update appropriate challenge list
      if (activeChallenge) {
        const newUserChallenges = userChallenges.filter(c => c.id !== challengeId);
        setUserChallenges(newUserChallenges);
        localStorage.setItem('userChallenges', JSON.stringify(newUserChallenges));
      } else {
        const newPendingChallenges = pendingChallenges.filter(c => c.id !== challengeId);
        setPendingChallenges(newPendingChallenges);
        localStorage.setItem('pendingChallenges', JSON.stringify(newPendingChallenges));
      }
      
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
      
      // If this was the last challenge in current tab, maybe suggest switching
      if (activeTab === 'active' && userChallenges.length <= 1) {
        setTimeout(() => {
          showNotification("No active challenges. Check available challenges to join new ones!", true);
        }, 2000);
      } else if (activeTab === 'upcoming' && pendingChallenges.length <= 1) {
        setTimeout(() => {
          showNotification("No upcoming challenges. Check available challenges to join new ones!", true);
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
    // Look for the challenge in both active and pending challenges
    const challenge = userChallenges.find(c => c.id === challengeId) || 
                      pendingChallenges.find(c => c.id === challengeId);
    
    if (challenge) {
      setChallengeToEdit(challenge);
      setShowChallengeForm(true);
    }
  };
  
  // Add function to handle form submission with date validation
  const handleSaveChallenge = (challengeData) => {
    // Validate dates before saving
    const isNewChallenge = !challengeToEdit;
    const dateErrors = validateChallengeDates(challengeData, isNewChallenge);
    
    if (Object.keys(dateErrors).length > 0) {
      // Show first error message
      const firstError = Object.values(dateErrors)[0];
      showNotification(`Cannot save challenge: ${firstError}`, false);
      return;
    }
    
    const now = new Date();
    const startDate = new Date(challengeData.start_date);
    const endDate = new Date(challengeData.end_date);
    
    // Check if challenge should be active or pending
    const isActive = now >= startDate && now <= endDate;
    const isPending = now < startDate;
    
    // Check if we're editing or creating
    if (challengeToEdit) {
      // Editing existing challenge
      if (isActive) {
        // Update in active challenges
        const updatedUserChallenges = userChallenges.map(c => 
          c.id === challengeData.id ? challengeData : c
        );
        
        // Also remove from pending if it was there before
        const updatedPendingChallenges = pendingChallenges.filter(c => 
          c.id !== challengeData.id
        );
        
        setUserChallenges(updatedUserChallenges);
        setPendingChallenges(updatedPendingChallenges);
        
        localStorage.setItem('userChallenges', JSON.stringify(updatedUserChallenges));
        localStorage.setItem('pendingChallenges', JSON.stringify(updatedPendingChallenges));
        
        // Switch to active tab
        setActiveTab('active');
      } else if (isPending) {
        // Update in pending challenges
        const updatedPendingChallenges = pendingChallenges.map(c => 
          c.id === challengeData.id ? challengeData : c
        );
        
        // Also remove from active if it was there before
        const updatedUserChallenges = userChallenges.filter(c => 
          c.id !== challengeData.id
        );
        
        setPendingChallenges(updatedPendingChallenges);
        setUserChallenges(updatedUserChallenges);
        
        localStorage.setItem('pendingChallenges', JSON.stringify(updatedPendingChallenges));
        localStorage.setItem('userChallenges', JSON.stringify(updatedUserChallenges));
        
        // Switch to upcoming tab
        setActiveTab('upcoming');
      } else {
        // Challenge is now expired - should not happen due to validation
        showNotification('Cannot save challenge with end date in the past.', false);
        setShowChallengeForm(false);
        setChallengeToEdit(null);
        return;
      }
      
      // Update challenge tracking data with new genre settings if changed
      try {
        const storedMap = localStorage.getItem('challengeBookMap') || '{}';
        const challengeBookMap = JSON.parse(storedMap);
        
        if (challengeBookMap[challengeData.id]) {
          challengeBookMap[challengeData.id].challengeName = challengeData.name;
          challengeBookMap[challengeData.id].isGenreSpecific = challengeData.is_genre_specific;
          // Store genre in consistent format
          challengeBookMap[challengeData.id].targetGenre = challengeData.genre ? challengeData.genre.toLowerCase() : '';
          
          localStorage.setItem('challengeBookMap', JSON.stringify(challengeBookMap));
        }
      } catch (e) {
        console.warn('Error updating challenge tracking data:', e);
      }
      
      showNotification(`Updated "${challengeData.name}" challenge!`, true);
    } else {
      // Creating new challenge
      if (isActive) {
        // Add to active challenges
        setUserChallenges(prev => [...prev, challengeData]);
        localStorage.setItem('userChallenges', JSON.stringify([...userChallenges, challengeData]));
        setActiveTab('active');
      } else if (isPending) {
        // Add to pending challenges
        setPendingChallenges(prev => [...prev, challengeData]);
        localStorage.setItem('pendingChallenges', JSON.stringify([...pendingChallenges, challengeData]));
        setActiveTab('upcoming');
      } else {
        // Challenge is expired - should not be allowed due to validation
        showNotification('Cannot create a challenge with end date in the past.', false);
        setShowChallengeForm(false);
        setChallengeToEdit(null);
        return;
      }
      
      // Initialize challenge tracking
      try {
        const storedMap = localStorage.getItem('challengeBookMap') || '{}';
        const challengeBookMap = JSON.parse(storedMap);
        
        // Initialize tracking for this new challenge with consistent genre format
        challengeBookMap[challengeData.id] = {
          bookIds: [],
          genres: new Set(),
          classicsCount: 0,
          challengeName: challengeData.name,
          isGenreSpecific: challengeData.is_genre_specific,
          targetGenre: challengeData.genre ? challengeData.genre.toLowerCase() : ''
        };
        
        localStorage.setItem('challengeBookMap', JSON.stringify(challengeBookMap));
      } catch (e) {
        console.warn('Error initializing challenge tracking:', e);
      }
      
      // Show notification
      showNotification(`Created "${challengeData.name}" challenge!`, true);
    }
    
    // Close the form
    setShowChallengeForm(false);
    setChallengeToEdit(null);
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
      const storedPendingChallenges = localStorage.getItem('pendingChallenges') || '[]';
      
      if (!storedChallenges && !storedPendingChallenges) {
        console.warn('No challenges found');
        return;
      }
      
      const challenges = JSON.parse(storedChallenges || '[]');
      const pendingChals = JSON.parse(storedPendingChallenges);
      
      // Recategorize all challenges
      const { active, pending, expired, completed } = categorizeChallenges([
        ...challenges,
        ...pendingChals
      ]);
      
      // Get existing completed and expired challenges
      const storedCompletedChallenges = localStorage.getItem('completedChallenges') || '[]';
      const storedExpiredChallenges = localStorage.getItem('expiredChallenges') || '[]';
      
      const existingCompleted = JSON.parse(storedCompletedChallenges);
      const existingExpired = JSON.parse(storedExpiredChallenges);
      
      // Combine with new completed and expired
      const existingCompletedIds = new Set(existingCompleted.map(c => c.id));
      const existingExpiredIds = new Set(existingExpired.map(c => c.id));
      
      const newCompleted = completed.filter(c => !existingCompletedIds.has(c.id));
      const newExpired = expired.filter(c => !existingExpiredIds.has(c.id));
      
      const allCompleted = [...existingCompleted, ...newCompleted];
      const allExpired = [...existingExpired, ...newExpired];
      
      // Update state and localStorage
      setUserChallenges(active);
      setPendingChallenges(pending);
      setCompletedChallenges(allCompleted);
      setExpiredChallenges(allExpired);
      
      localStorage.setItem('userChallenges', JSON.stringify(active));
      localStorage.setItem('pendingChallenges', JSON.stringify(pending));
      localStorage.setItem('completedChallenges', JSON.stringify(allCompleted));
      localStorage.setItem('expiredChallenges', JSON.stringify(allExpired));
      localStorage.setItem('challengeBookMap', JSON.stringify(challengeBookMap));
      
      alert('Challenge statuses updated successfully. The page will refresh.');
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
      localStorage.removeItem('pendingChallenges');
      localStorage.removeItem('completedChallenges');
      localStorage.removeItem('expiredChallenges');
      
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
      // Filter out any active challenges with end date in the past
      return userChallenges.filter(challenge => !isDateInPast(challenge.end_date));
    } else if (activeTab === 'upcoming') {
      return pendingChallenges;
    } else if (activeTab === 'completed') {
      return completedChallenges;
    } else if (activeTab === 'expired') {
      return expiredChallenges;
    } else if (activeTab === 'available') {
      // Filter out any available challenges with end date in the past
      return availableChallenges.filter(challenge => !isDateInPast(challenge.end_date));
    } else {
      return [];
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
            <span className="level-value">{userLevel || 1}</span>
            <span className="points-value">{userPoints || 0} PTS</span>
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
            onClick={() => setActiveTab('upcoming')}
            className={`tab-button ${activeTab === 'upcoming' ? 'active' : ''} ${theme === 'dark' ? 'dark-tab' : ''}`}
          >
            Upcoming
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
                    
                    {(activeTab === 'active' || activeTab === 'upcoming' || activeTab === 'completed') && (
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
                    
                    {(activeTab === 'active' || activeTab === 'upcoming') && (
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
                  {activeTab === 'upcoming' && "You don't have any upcoming challenges."}
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