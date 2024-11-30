import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext'; // Import AuthContext
import '../styles/Login.css'; 

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { handleLogin } = useContext(AuthContext); // Access login function
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Both fields are required.');
      return;
    }

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/login/', {
        username,
        password,
      });
      console.log('Login response data:', response.data);

      if (response.status === 200) {
        handleLogin(response.data); // Update global state with user data
        navigate('/'); // Redirect to home
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred during login.');
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