import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../AuthContext'; // Import AuthContext

const Home = () => {
  const { handleLogout } = useContext(AuthContext); // Access logout function
  const navigate = useNavigate();

  const handleLogoutClick = async () => {
    try {
      await axios.post('/api/logout'); // Call backend API
      handleLogout(); // Update global state
      navigate('/login'); // Redirect to login
    } catch (error) {
      console.error('Logout error:', error);
      alert('Failed to logout. Please try again.');
    }
  };

  return (
    <div>
      <h1>Welcome to the Home Page</h1>
      <p>You are now logged in.</p>
      <button onClick={handleLogoutClick}>Logout</button>
    </div>
  );
};

export default Home;
