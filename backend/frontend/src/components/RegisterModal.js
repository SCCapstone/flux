import React, { useState, useContext } from 'react';
import { ThemeContext } from '../ThemeContext';
import axios from 'axios';
import '../styles/Modal.css';

const RegisterModal = ({ isOpen, onClose, openLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { theme } = useContext(ThemeContext);
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
  
  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!username || !password || !email) {
      setError('All fields are required.');
      return;
    }

    try {
      const response = await axios.post(`${apiBaseUrl}/register/`, {
        username,
        password,
        email,
      });

      if (response.status === 201) {
        setMessage('Account created successfully.');
        setTimeout(() => {
          onClose();
          openLogin();
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred during registration.');
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target.className === 'modal-overlay') {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className={`modal-content ${theme === 'dark' ? 'modal-dark' : 'modal-light'}`}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Create Account</h2>
        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}
        <form className="modal-form" onSubmit={handleSubmit}>
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
          <button type="submit" className="modal-button">Create Account</button>
        </form>
        <p className="modal-switch">
          Already have an account?{' '}
          <button 
            className="modal-link" 
            onClick={() => {
              onClose();
              openLogin();
            }}
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterModal;
