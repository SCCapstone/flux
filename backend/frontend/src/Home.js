import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Home = ({ onLogout }) => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await axios.post('/api/logout'); // Ensure this API exists and works
            onLogout(); // Update app's state
            navigate('/login'); // Redirect to login
        } catch (error) {
            console.error("Logout error:", error);
            alert("Failed to logout. Please try again.");
        }
    };

    return (
        <div>
            <h1>Welcome to the Home Page</h1>
            <p>You are now logged in.</p>
            <button onClick={handleLogout}>Logout</button>
        </div>
    );
};

export default Home;
