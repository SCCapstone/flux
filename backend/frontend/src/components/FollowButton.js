import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../AuthContext';
import '../styles/FollowButton.css';

const FollowButton = ({ username, onFollowChange }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);
  const isOwnProfile = user?.username === username;

  useEffect(() => {
    // Skip checking follow status if it's the user's own profile
    if (isOwnProfile || !user || !user.token) return;
    
    const checkFollowStatus = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `http://127.0.0.1:8000/api/users/${username}/check-follow/`,
          {
            headers: {
              'Authorization': `Bearer ${user.token}`
            }
          }
        );
        setIsFollowing(response.data.is_following);
        setError(null);
      } catch (error) {
        console.error('Error checking follow status:', error);
        setError('Failed to check follow status');
      } finally {
        setIsLoading(false);
      }
    };

    checkFollowStatus();
  }, [username, user, isOwnProfile]);

  const handleFollowToggle = async () => {
    if (!user || !user.token) {
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const endpoint = isFollowing ? '/api/users/unfollow/' : '/api/users/follow/';
      const response = await axios.post(
        `http://127.0.0.1:8000${endpoint}`,
        { username },
        {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Check if response is successful
      if (response.status >= 200 && response.status < 300) {
        const newFollowState = !isFollowing;
        setIsFollowing(newFollowState);
        
        if (onFollowChange) {
          onFollowChange(newFollowState);
        }
        
        console.log(`Successfully ${newFollowState ? 'followed' : 'unfollowed'} ${username}`);
      } else {
        throw new Error(`Failed to ${isFollowing ? 'unfollow' : 'follow'} user`);
      }
    } catch (error) {
      console.error('Error toggling follow status:', error);
      setError(`Failed to ${isFollowing ? 'unfollow' : 'follow'} user`);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render anything for own profile
  if (isOwnProfile) {
    return null;
  }

  return (
    <div className="follow-button-container">
      <button
        onClick={handleFollowToggle}
        disabled={isLoading}
        className={`follow-button ${isFollowing ? 'following' : ''} ${isLoading ? 'loading' : ''}`}
      >
        {isLoading ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}
      </button>
      {error && <div className="follow-error">{error}</div>}
    </div>
  );
};

export default FollowButton;