import React, { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import Navigation from "../components/Navigation";
import "../styles/Readlist.css";

// Share Readlist Modal Component
const ShareReadlistModal = ({ isOpen, onClose, onShare }) => {
  const [username, setUsername] = useState("");

  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Share Readlist</h3>
        <input
          type="text"
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button onClick={() => onShare(username)}>Share</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

const Readlist = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [readlists, setReadlists] = useState([]);
  const [sharedReadlists, setSharedReadlists] = useState([]);
  const [selectedReadlistId, setSelectedReadlistId] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Fetch the user's own readlists
  const fetchReadlists = useCallback(async () => {
    if (!user?.token) return;
    try {
      const response = await fetch("http://127.0.0.1:8000/api/readlists/", {
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
      const response = await fetch("http://127.0.0.1:8000/api/readlists/shared/", {
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
      const response = await fetch("http://127.0.0.1:8000/api/readlists/create/", {
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
      const response = await fetch(`http://127.0.0.1:8000/api/readlists/delete/${id}/`, {
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
      const response = await fetch("http://127.0.0.1:8000/api/readlists/share/", {
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
      <div className="page-container">
        <header className="readlist-header">
          <h1 className="readlist-title">My Readlists</h1>
          <button className="add-readlist-button" onClick={handleCreateReadlist}>
            + Add Readlist
          </button>
        </header>

        {/* User's Readlists */}
        <div className="readlist-grid">
          {readlists.map((list) => (
            <div key={list.id} className="readlist-card" onClick={() => navigate(`/readlist/${list.id}`)}>
              {list.books.length > 0 ? (
                <img src={list.books[0].image} alt={list.name} className="readlist-cover" />
              ) : (
                <div className="empty-cover">No Books</div>
              )}
              <h3 className="readlist-card-title">{list.name}</h3>
              <div className="readlist-actions">
                <button
                  className="share-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedReadlistId(list.id);
                    setIsShareModalOpen(true);
                  }}
                >
                  Share
                </button>
                <button
                  className="delete-button"
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
        <h2>Shared With Me</h2>
        <div className="readlist-grid">
          {sharedReadlists.map((list) => (
            <div key={list.id} className="readlist-card" onClick={() => navigate(`/readlist/${list.id}`)}>
              <h3>{list.name} (by {list.owner})</h3>
              {list.books.length > 0 ? (
                <img src={list.books[0].image} alt={list.name} className="readlist-cover" />
              ) : (
                <div className="empty-cover">No Books</div>
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
      />
    </>
  );
};

export default Readlist;
