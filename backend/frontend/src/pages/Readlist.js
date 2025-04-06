import React, { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import { ThemeContext } from "../ThemeContext";
import Navigation from "../components/Navigation";
import "../styles/Readlist.css";

// Share Readlist Modal Component
const ShareReadlistModal = ({ isOpen, onClose, onShare, theme }) => {
  const [username, setUsername] = useState("");

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className={`modal-content ${theme === 'dark' ? 'dark-mode' : ''}`}>
        <h3 className={theme === 'dark' ? 'text-gray-200' : ''}>Share Readlist</h3>
        <input
          type="text"
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={theme === 'dark' ? 'dark-input' : ''}
        />
        <div className="modal-buttons">
        <button onClick={() => onShare(username)} className={theme === 'dark' ? 'dark-share-btn' : ''}>Share</button>
        <button onClick={onClose} className={theme === 'dark' ? 'dark-cancel-btn' : ''}>Cancel</button>
        </div>
      </div>
    </div>
  );
};
const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

const Readlist = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const [readlists, setReadlists] = useState([]);
  const [sharedReadlists, setSharedReadlists] = useState([]);
  const [selectedReadlistId, setSelectedReadlistId] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Fetch the user's own readlists
  const fetchReadlists = useCallback(async () => {
    if (!user?.token) return;
    try {
      const response = await fetch(`${apiBaseUrl}/readlists/`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setReadlists(data);
      }
    } catch (error) {
      console.error("Error fetching readlists:", error);
    }
  }, [user]);

  // Fetch readlists that have been shared with the user
  const fetchSharedReadlists = useCallback(async () => {
    if (!user?.token) return;
    try {
      const response = await fetch(`${apiBaseUrl}/readlists/shared/`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSharedReadlists(data);
      }
    } catch (error) {
      console.error("Error fetching shared readlists:", error);
    }
  }, [user]);

  useEffect(() => {
    fetchReadlists();
    fetchSharedReadlists();
  }, [fetchReadlists, fetchSharedReadlists]);

  // Function to create a new readlist
  const handleCreateReadlist = async () => {
    const name = prompt("Enter Readlist Name:");
    if (!name) return;

    try {
      const response = await fetch(`${apiBaseUrl}/readlists/create/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });
      if (response.ok) fetchReadlists();
    } catch (error) {
      console.error("Error creating readlist:", error);
    }
  };

  // Function to delete a readlist
  const handleDeleteReadlist = async (id) => {
    try {
      const response = await fetch(`${apiBaseUrl}/readlists/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (response.ok) {
        fetchReadlists();
        fetchSharedReadlists();
      }
    } catch (error) {
      console.error("Error deleting readlist:", error);
    }
  };

  // Function to share a readlist with another user
  const handleShareReadlist = async (username) => {
    if (!selectedReadlistId || !username) return;
    try {
      const response = await fetch(`${apiBaseUrl}/readlists/share/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ readlist_id: selectedReadlistId, target_username: username }),
      });

      if (response.ok) {
        alert(`Readlist shared with ${username}`);
        setIsShareModalOpen(false);
      } else {
        const errorData = await response.json();
        alert(errorData.error);
      }
    } catch (error) {
      console.error("Error sharing readlist:", error);
    }
  };

  return (
    <>
      <Navigation />
      <div className={`page-container ${theme === 'dark' ? 'dark-mode' : ''}`}>
        <header className="readlist-header">
          <h1 className={`readlist-title ${theme === 'dark' ? 'dark-title' : ''}`}>My Readlists</h1>
          <button className={`add-readlist-button ${theme === 'dark' ? 'dark-add-btn' : ''}`} onClick={handleCreateReadlist}>
            + Add Readlist
          </button>
        </header>

        {/* User's Readlists */}
        <div className="readlist-grid">
          {readlists.map((list) => (
            <div key={list.id} className={`readlist-card ${theme === 'dark' ? 'dark-card' : ''}`} onClick={() => navigate(`/readlist/${list.id}`)}>
              {list.books.length > 0 ? (
                <img src={list.books[0].image} alt={list.name} className="readlist-cover" />
              ) : (
                <div className={`empty-cover ${theme === 'dark' ? 'dark-empty-cover' : ''}`}>No Books</div>
              )}
              <h3 className={`readlist-card-title ${theme === 'dark' ? 'dark-card-title' : ''}`}>{list.name}</h3>
              <div className="readlist-actions">
                <button
                  className={`share-button ${theme === 'dark' ? 'dark-share-btn' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedReadlistId(list.id);
                    setIsShareModalOpen(true);
                  }}
                >
                  Share
                </button>
                <button
                  className={`delete-button ${theme === 'dark' ? 'dark-delete-btn' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteReadlist(list.id);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Readlists Shared with User */}
        <h2 className={theme === 'dark' ? 'dark-subtitle' : ''}>Shared With Me</h2>
        <div className="readlist-grid">
          {sharedReadlists.map((list) => (
            <div key={list.id} className={`readlist-card ${theme === 'dark' ? 'dark-card' : ''}`} onClick={() => navigate(`/readlist/${list.id}`)}>
              <h3 className={`readlist-card-title ${theme === 'dark' ? 'dark-card-title' : ''}`}>{list.name} (by {list.owner})</h3>
              {list.books.length > 0 ? (
                <img src={list.books[0].image} alt={list.name} className="readlist-cover" />
              ) : (
                <div className={`empty-cover ${theme === 'dark' ? 'dark-empty-cover' : ''}`}>No Books</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Share Readlist Modal */}
      <ShareReadlistModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onShare={handleShareReadlist}
        theme={theme}
      />
    </>
  );
};

export default Readlist;
