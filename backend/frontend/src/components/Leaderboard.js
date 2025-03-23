import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../AuthContext';
import Navigation from '../components/Navigation';
import '../styles/Leaderboard.css';

const Leaderboard = () => {
  const { user } = useContext(AuthContext);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState(null);
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

  const fetchLeaderboard = useCallback(async () => {
    if (!user?.token) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/leaderboard/`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLeaderboardData(data);
        
        // Find user's rank in the leaderboard
        const currentUserIndex = data.findIndex(entry => entry.username === user.username);
        if (currentUserIndex !== -1) {
          setUserRank(currentUserIndex + 1);
        }
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.token) {
      fetchLeaderboard();
    }
  }, [user, fetchLeaderboard]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6">Readers Leaderboard</h1>
        
        {loading ? (
          <div className="text-center py-10">
            <p>Loading leaderboard...</p>
          </div>
        ) : (
          <>
            {/* User's current rank */}
            {userRank && (
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 shadow-lg mb-8">
                <h2 className="text-lg font-semibold mb-2">Your Current Rank</h2>
                <div className="flex items-center">
                  <div className="text-4xl font-bold mr-3">#{userRank}</div>
                  <div>
                    <p className="font-medium">{user.username}</p>
                    <p className="text-sm opacity-80">
                      Level {leaderboardData[userRank - 1]?.level || 0} • {leaderboardData[userRank - 1]?.total_points || 0} points
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Leaderboard Table */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50">
      <tr>
        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reader</th>
        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Achievements</th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {leaderboardData.map((entry, index) => (
        <tr key={index} className={entry.username === user.username ? "bg-blue-50" : ""}>
          <td className="px-6 py-4 whitespace-nowrap">
            {index === 0 ? (
              <span className="inline-flex items-center justify-center w-8 h-8 bg-yellow-400 text-white rounded-full">1</span>
            ) : (
              <span>{index + 1}</span>
            )}
          </td>
          <td className="px-6 py-4 whitespace-nowrap font-medium">{entry.username}</td>
          <td className="px-6 py-4 whitespace-nowrap">Level {entry.level}</td>
          <td className="px-6 py-4 whitespace-nowrap">{entry.points}</td>
          <td className="px-6 py-4 whitespace-nowrap">{entry.achievements}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
          </>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;