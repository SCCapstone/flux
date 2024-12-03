import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/Register.css';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!username || !password || !email) {
      setError('All fields are required.');
      return;
    }

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/register/', {
        username,
        password,
        email,
      });

      if (response.status === 201) {
        setMessage('Account created successfully.');
        setTimeout(() => navigate('/login'), 2000); // Redirect after 2 seconds
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred during registration.');
    }
  };

return (
  <div className="register-container">
    <h2>Create Account</h2>
    {error && <p className="error-message">{error}</p>}
    {message && <p className="success-message">{message}</p>}
    <form className="register-form" onSubmit={handleSubmit}>
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
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button type="submit">Create Account</button>
    </form>
  </div>
);
};

export default Register;