import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import BookDetails from './pages/Book-Details';
import { AuthContext } from './AuthContext'; // Use AuthContext

function App() {
  const { isLoggedIn } = useContext(AuthContext); // Access login state

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={isLoggedIn ? <Home /> : <Navigate to="/login" />}
        />
        <Route
          path="/login"
          element={<Login />}
        />
        <Route
          path="/register"
          element={<Register />}
        />
        <Route
          path="/bookdetails"
          element={<BookDetails />}
        />
      </Routes>
    </Router>
  );
}

export default App;
