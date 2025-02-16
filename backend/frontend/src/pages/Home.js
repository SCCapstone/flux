import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../AuthContext';
import Navigation from '../components/Navigation';
import '../styles/Home.css';
import DisplayBooks from "../components/DisplayBooks";

const Home = () => {
  const { user } = useContext(AuthContext);
  const [books, setBooks] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [xp, setXp] = useState(0);
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    if (user?.token) {
      fetch('http://127.0.0.1:8000/api/profile/', {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        }
      })
        .then(response => response.json())
        .then(data => {
          setXp(data.xp);
          setAchievements(data.achievements || []);
        })
        .catch(err => console.error('Error fetching XP:', err));
    }
  }, [user]);

  const handleFavorite = async (book) => {
    if (!user?.token) return;

  const isFavorite = favorites.some((fav) => fav.google_books_id === book.id);
  
  try {
    const response = await fetch(`http://127.0.0.1:8000/api/favorites/${isFavorite ? 'remove' : 'add'}/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ book_id: book.id })
    });

    if (response.ok) {
      addXp(10, "First Favorite Added");
    }
  } catch (error) {
    console.error('Error updating favorites:', error);
  }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h2>📚 Welcome to the Book Explorer</h2>
        <p>⭐ XP: {xp}</p>

        <DisplayBooks
          books={books}
          favorites={favorites}
          handleFavorite={handleFavorite}
        />

        {/* Display Achievements */}
        <div className="achievements">
          <h3>🏆 Achievements</h3>
          {achievements.length > 0 ? (
            <ul>
              {achievements.map((badge, index) => (
                <li key={index}>{badge}</li>
              ))}
            </ul>
          ) : (
            <p>No achievements yet. Start exploring books!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
