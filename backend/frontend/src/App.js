import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import BookDetails from './pages/Book-Details';
import Profile from './pages/Profile';
import Favorites from './pages/Favorites';
import AuthorDetails from "./pages/Author-Details";
import BestSellers from './pages/BestSellers';
import { AuthContext } from './AuthContext';

function App() {
  const { isLoggedIn, unlockAchievement } = useContext(AuthContext);

  const ProtectedRoute = ({ children }) => {
    if (!isLoggedIn) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          isLoggedIn ? <Navigate to="/" replace /> : <Login />
        } />
        <Route path="/register" element={
          isLoggedIn ? <Navigate to="/" replace /> : <Register />
        } />
        <Route path="/" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
        <Route path="/book-details" element={
          <ProtectedRoute>
            <BookDetails onUnlockAchievement={unlockAchievement} />
          </ProtectedRoute>
        } />
        <Route path="/author-details" element={
          <ProtectedRoute>
            <AuthorDetails />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/favorites" element={
          <ProtectedRoute>
            <Favorites />
          </ProtectedRoute>
        } />
        <Route path="/bestsellers" element={
          <ProtectedRoute>
            <BestSellers />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
