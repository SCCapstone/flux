import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import Home from "./Home";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => JSON.parse(localStorage.getItem("isLoggedIn")) || false // Persist login state
  );

  // Function to handle login
  const handleLogin = () => {
    setIsLoggedIn(true);
    localStorage.setItem("isLoggedIn", true); // Save login state
  };

  // Function to handle logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("isLoggedIn"); // Clear login state
  };

  return (
    <Router>
      <Routes>
        {/* Redirect to Login if not logged in */}
        <Route
          path="/"
          element={isLoggedIn ? <Home onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/login"
          element={<Login onLogin={handleLogin} />}
        />
        <Route
          path="/register"
          element={<Register />}
        />
        <Route
          path="/home"
          element={<Home />}
        />
      </Routes>
    </Router>
  );
}

export default App;
