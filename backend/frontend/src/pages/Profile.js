import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../AuthContext';

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState({ username: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.token) {
        setLoading(false);
        setError('No authentication token found');
        return;
      }

      try {
        console.log('Fetching with token:', user.token);
        const response = await fetch('http://127.0.0.1:8000/api/profile/', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Profile data received:', data);
        
        if (data.username && data.email) {
          setProfile(data);
        } else {
          console.warn('Received data is missing required fields:', data);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  if (!user) {
    return <p>Please log in to view your profile.</p>;
  }

  if (loading) {
    return <p>Loading profile...</p>;
  }

  if (error) {
    return <p>Error loading profile: {error}</p>;
  }

  return (
    <div>
      <h1>Profile</h1>
      <div style={{ marginBottom: '20px' }}>
        <p><strong>Username:</strong> {profile.username || 'Not available'}</p>
        <p><strong>Email:</strong> {profile.email || 'Not available'}</p>
      </div>
      
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f5f5f5' }}>
        <h3>Debug Information</h3>
        <p>Auth Status: {user ? 'Authenticated' : 'Not authenticated'}</p>
        <p>Profile State: {JSON.stringify(profile, null, 2)}</p>
      </div>
    </div>
  );
};

export default Profile;