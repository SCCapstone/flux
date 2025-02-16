import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../AuthContext';
import Navigation from '../components/Navigation';
import '../styles/Profile.css';

const Profile = () => {
  const { user, xp, achievements } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h2>Welcome, {user.username}</h2>
        <p>Email: {user.email}</p>
        <p>⭐ XP: {xp}</p>

        {/* Achievements & Badges */}
        <div className="achievements">
          <h3>🏆 Achievements & Badges</h3>
          {achievements.length > 0 ? (
            <ul>
              {achievements.map((badge, index) => (
                <li key={index} className="badge">{badge}</li>
              ))}
            </ul>
          ) : (
            <p>No achievements yet. Start interacting with books!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
