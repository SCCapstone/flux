import React from 'react';
import Navigation from '../components/Navigation';
import BookList from '../components/BookList'; 
import "../styles/Favorites.css";

const Favorites = () => (
  <div className="min-h-screen bg-gray-50">
    <Navigation />
    <BookList apiEndpoint="http://127.0.0.1:8000/api/favorites" title="My Favorites" />
  </div>
);

export default Favorites;
