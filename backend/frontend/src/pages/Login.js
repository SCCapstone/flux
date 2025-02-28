import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import '../styles/Login.css'; 

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { handleLogin } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Both fields are required.');
      return;
    }

    try {
      console.log('Logging in with username:', username);
      
      const response = await axios.post('http://127.0.0.1:8000/api/login/', {
        username,
        password,
      });

      console.log('Login response:', response.data);

      if (response.data && response.data.token) {
        // Store token in localStorage
        localStorage.setItem('token', response.data.token);
        
        // Make sure username is provided, fall back to form input if needed
        const loginUsername = response.data.username || username;
        console.log('Using username for login:', loginUsername);
        
        // Create user object
        const userData = {
          username: loginUsername,
          email: response.data.email || '',
          token: response.data.token,
          bio: response.data.bio || ''
        };
        
        console.log('Login user data to be stored:', userData);
        
        // Store user object directly in localStorage as a backup
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Update context with login handler
        handleLogin(userData);
        
        navigate('/');
      } else {
        console.error('Invalid login response:', response.data);
        setError('Invalid login response from server');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'An error occurred during login.');
      setUsername('');
      setPassword('');
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      {error && <p className="error-message">{error}</p>}
      <form className="login-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Login</button>
      </form>
      <p className="register-link">
        Don't have an account? <a href="/register">Create Account</a>
      </p>
    </div>
  );
};

export default Login;