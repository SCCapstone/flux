import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../AuthContext'; // Import AuthContext for global state management

const Home = () => {
  const { handleLogout } = useContext(AuthContext); // Access the logout function from context
  const navigate = useNavigate();

  const handleLogoutClick = async () => {
    try {
      // Send a POST request to the logout endpoint with CSRF token
      await axios.post('http://127.0.0.1:8000/api/logout/', {}, {
        headers: {
          'X-CSRFToken': getCookie('csrftoken'), // Include CSRF token in the headers
        },
      });
      handleLogout(); // Update the global authentication state
      navigate('/login'); // Redirect to the login page
    } catch (error) {
      console.error('Logout error:', error.response || error.message);
      alert('Failed to logout. Please try again.');
    }
  };

  // Utility function to retrieve the CSRF token from cookies
  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  return (
    <div>
      <h1>Welcome to the Home Page</h1>
      <p>You are now logged in.</p>
      <button onClick={handleLogoutClick}>Logout</button>
    </div>
  );
};

export default Home;
