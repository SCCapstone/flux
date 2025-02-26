import React, { useContext, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import BookDetails from './pages/Book-Details';
import Profile from './pages/Profile';
import Favorites from './pages/Favorites';
import AuthorDetails from "./pages/Author-Details";
import BestSellers from './pages/BestSellers';
import UserProfile from './pages/UserProfile';
import UserSearch from './pages/UserSearch';
import { AuthContext } from './AuthContext';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy loaded gamification pages
const Challenges = lazy(() => import('./components/Challenges'));
const Leaderboard = lazy(() => import('./components/Leaderboard'));
const Achievements = lazy(() => import('./components/Achievements'));

function App() {
  const { isLoggedIn } = useContext(AuthContext);
  
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
            <BookDetails />
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
        <Route path="/user/:username" element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        } />
        <Route path="/search-users" element={
          <ProtectedRoute>
            <UserSearch />
          </ProtectedRoute>
        } />
        
        {/* Lazy loaded gamification routes */}
        <Route path="/challenges" element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingSpinner message="Loading challenges..." />}>
              <Challenges />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/leaderboard" element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingSpinner message="Loading leaderboard..." />}>
              <Leaderboard />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/achievements" element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingSpinner message="Loading achievements..." />}>
              <Achievements />
            </Suspense>
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;