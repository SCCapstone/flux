import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import Navigation from '../components/Navigation';
import ReadlistPopup from '../components/ReadlistPopup';
import '../styles/Readlist.css';

const Readlist = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [readlists, setReadlists] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  
  const fetchReadlists = useCallback(async () => {
    if (!user?.token) return;
    try {
      const response = await fetch('http://127.0.0.1:8000/api/readlists/', {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        }
      });
      if (response.ok) {
        const data = await response.json();
        setReadlists(data);
      }
    } catch (error) {
      console.error('Error fetching readlists:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchReadlists();
  }, [fetchReadlists]);

  const handleCreateReadlist = async (name) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/readlists/create/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });
      if (response.ok) {
        fetchReadlists();
      }
    } catch (error) {
      console.error('Error creating readlist:', error);
    }
  };

  const handleDeleteReadlist = async (id) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/readlists/${id}/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      });
      if (response.ok) {
        fetchReadlists();
      }
    } catch (error) {
      console.error('Error deleting readlist:', error);
    }
  };

  return (
    <div className="readlist-container">
      <Navigation />
      <div className="readlist-content">
        <h1 className="readlist-title">My Readlists</h1>
        <button
  className="create-button"
  onClick={() => {
    const listName = prompt("Enter Readlist Name:");
    if (listName) handleCreateReadlist(listName);
  }}
>
  Create Readlist
</button>
        {showPopup && <ReadlistPopup onCreate={handleCreateReadlist} onClose={() => setShowPopup(false)} />}
        <div className="readlist-grid">
          {readlists.map((list) => (
            <div key={list.id} className="readlist-card">
              <div onClick={() => navigate(`/readlist/${list.id}`)}>
                {list.books.length > 0 ? (
                  <img src={list.books[0].image} alt={list.name} className="readlist-cover" />
                ) : (
                  <div className="empty-cover">No Books</div>
                )}
                <h3>{list.name}</h3>
              </div>
              <button className="delete-button" onClick={() => handleDeleteReadlist(list.id)}>Delete</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Readlist;
