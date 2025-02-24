import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../AuthContext';
import Navigation from '../components/Navigation';
import '../styles/Gamification.css';

const Challenges = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('active');
  const [availableChallenges, setAvailableChallenges] = useState([]);
  const [userChallenges, setUserChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchChallenges = useCallback(async () => {
    if (!user?.token) return;
    
    setLoading(true);
    try {
      const headers = {
        'Authorization': `Bearer ${user.token}`,
      };
      
      // Fetch available challenges
      const availableResponse = await fetch('http://127.0.0.1:8000/api/challenges/', { headers });
      const availableData = await availableResponse.json();
      setAvailableChallenges(availableData);
      
      // Fetch user's challenges
      const userResponse = await fetch('http://127.0.0.1:8000/api/user/challenges/', { headers });
      const userData = await userResponse.json();
      setUserChallenges(userData);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.token) {
      fetchChallenges();
    }
  }, [user, fetchChallenges]);

  const handleJoinChallenge = async (challengeId) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/challenges/join/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ challenge_id: challengeId }),
      });
      
      if (response.ok) {
        // Refresh challenges after joining
        fetchChallenges();
      }
    } catch (error) {
      console.error('Error joining challenge:', error);
    }
  };

  // Filter user challenges based on active tab
  const filteredUserChallenges = userChallenges.filter(challenge => {
    if (activeTab === 'active') {
      return !challenge.completed && challenge.days_remaining > 0;
    } else if (activeTab === 'completed') {
      return challenge.completed;
    } else { // expired
      return !challenge.completed && challenge.days_remaining <= 0;
    }
  });

  // Filter available challenges to only show ones user hasn't joined
  const filteredAvailableChallenges = availableChallenges.filter(
    challenge => !userChallenges.some(uc => uc.id === challenge.id)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6">Reading Challenges</h1>
        
        {/* Tabs - Using a more button-like style to match the rest of the app */}
        <div className="mb-6 flex space-x-2">
          <button
            onClick={() => setActiveTab('active')}
            className={`py-2 px-4 rounded-md font-medium ${
              activeTab === 'active'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Active Challenges
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`py-2 px-4 rounded-md font-medium ${
              activeTab === 'completed'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setActiveTab('expired')}
            className={`py-2 px-4 rounded-md font-medium ${
              activeTab === 'expired'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Expired
          </button>
          <button
            onClick={() => setActiveTab('available')}
            className={`py-2 px-4 rounded-md font-medium ${
              activeTab === 'available'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Available Challenges
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-2"></div>
            <p>Loading challenges...</p>
          </div>
        ) : (
          <>
            {activeTab === 'available' ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredAvailableChallenges.length > 0 ? (
                  filteredAvailableChallenges.map(challenge => (
                    <div key={challenge.id} className="bg-white shadow rounded-lg overflow-hidden">
                      <div className="p-5">
                        <h3 className="text-lg font-bold text-gray-900">{challenge.name}</h3>
                        <p className="mt-1 text-gray-600">{challenge.description}</p>
                        <div className="mt-4">
                          <span className="text-sm font-medium text-blue-600">
                            Goal: Read {challenge.target_books} books
                          </span>
                        </div>
                        <div className="mt-2 flex justify-between text-sm">
                          <span>Starts: {new Date(challenge.start_date).toLocaleDateString()}</span>
                          <span>Ends: {new Date(challenge.end_date).toLocaleDateString()}</span>
                        </div>
                        <div className="mt-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {challenge.days_remaining} days remaining
                          </span>
                        </div>
                        <button
                          onClick={() => handleJoinChallenge(challenge.id)}
                          className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                        >
                          Join Challenge
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="md:col-span-2 lg:col-span-3 text-center py-10">
                    <p>No available challenges at the moment. Check back later!</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {filteredUserChallenges.length > 0 ? (
                  filteredUserChallenges.map(challenge => (
                    <div key={challenge.id} className="bg-white shadow rounded-lg overflow-hidden">
                      <div className="p-5">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{challenge.name}</h3>
                            <p className="mt-1 text-gray-600">{challenge.description}</p>
                          </div>
                          {challenge.completed ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Completed
                            </span>
                          ) : challenge.days_remaining > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {challenge.days_remaining} days left
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Expired
                            </span>
                          )}
                        </div>
                        
                        <div className="mt-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress: {challenge.books_read} / {challenge.target_books} books</span>
                            <span>{challenge.progress_percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className={`h-2.5 rounded-full ${
                                challenge.completed 
                                  ? 'bg-green-600' 
                                  : challenge.days_remaining <= 0 
                                    ? 'bg-red-600' 
                                    : 'bg-blue-600'
                              }`}
                              style={{ width: `${challenge.progress_percentage}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="mt-4 flex justify-between text-sm text-gray-500">
                          <span>Started: {new Date(challenge.start_date).toLocaleDateString()}</span>
                          <span>Ends: {new Date(challenge.end_date).toLocaleDateString()}</span>
                        </div>
                        
                        {challenge.completed && (
                          <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-3">
                            <div className="flex">
                              <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div className="ml-3">
                                <p className="text-sm text-green-800">
                                  Completed on {new Date(challenge.completed_date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <p>
                      {activeTab === 'active' && "You're not participating in any active challenges."}
                      {activeTab === 'completed' && "You haven't completed any challenges yet."}
                      {activeTab === 'expired' && "You don't have any expired challenges."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Challenges;