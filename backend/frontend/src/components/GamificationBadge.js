import React, { useContext } from 'react';
import { AuthContext } from '../AuthContext';
import '../styles/Gamification.css';

const GamificationBadge = () => {
  const { userLevel, userPoints } = useContext(AuthContext);
  
  return (
    <div className="inline-flex items-center bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full px-3 py-1 shadow-sm">
      <div className="mr-2">
        <span className="text-xs block">LEVEL</span>
        <span className="text-xl font-bold">{userLevel || 1}</span>
      </div>
      <div>
        <span className="text-xs block">POINTS</span>
        <span className="text-lg font-semibold">{userPoints || 0}</span>
      </div>
    </div>
  );
};

export default GamificationBadge;