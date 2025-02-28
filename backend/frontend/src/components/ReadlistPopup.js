import React, { useState, useEffect } from "react";
import "../styles/ReadlistPopup.css";

const ReadlistPopup = ({ book, onClose, onSave }) => {
  const [readlists, setReadlists] = useState([]);
  const [selectedReadlists, setSelectedReadlists] = useState(new Set());
  const [newReadlistName, setNewReadlistName] = useState("");
  const [creatingReadlist, setCreatingReadlist] = useState(false);

  useEffect(() => {
    // Fetch user's readlists
    const fetchReadlists = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/readlists/", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setReadlists(data);

          // Check which readlists the book is already in
          if (book?.google_books_id) {
            const currentLists = new Set(
              data
                .filter((list) =>
                  list.books.some(
                    (b) => b.google_books_id === book.google_books_id
                  )
                )
                .map((list) => list.id)
            );
            setSelectedReadlists(currentLists);
          } else if (book?.id) {
            // If your 'book' uses just an 'id'
            const currentLists = new Set(
              data
                .filter((list) =>
                  list.books.some((b) => b.id === book.id)
                )
                .map((list) => list.id)
            );
            setSelectedReadlists(currentLists);
          }
        }
      } catch (error) {
        console.error("Error fetching readlists:", error);
      }
    };

    if (book) fetchReadlists();
  }, [book]);

  // Toggle readlist selection
  const handleToggleReadlist = (readlistId) => {
    setSelectedReadlists((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(readlistId)) {
        newSet.delete(readlistId);
      } else {
        newSet.add(readlistId);
      }
      return newSet;
    });
  };

  // Create & Update readlist associations
const handleSave = async () => {
  if (!book || (!book.id && !book.google_books_id)) {
    return;
  }

  // Build the request payload with all fields:
  const payload = {
    book_id: book.id || book.google_books_id,
    title: book.title || "",
    author: book.author || "",
    description: book.description || "",
    genre: book.genre || "",
    image: book.image || "",
    year: book.year || "",
    readlist_ids: Array.from(selectedReadlists),
  };

  try {
    const response = await fetch("http://127.0.0.1:8000/api/readlists/update/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      onSave(); // Close the popup
    }
  } catch (error) {
    console.error("Error updating readlists:", error);
  }
};

// Create a new readlist
const handleCreateReadlist = async () => {
  if (!newReadlistName.trim()) return;

  try {
    const response = await fetch("http://127.0.0.1:8000/api/readlists/create/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ name: newReadlistName }),
    });

    if (response.ok) {
      const newReadlist = await response.json();
      setReadlists((prev) => [...prev, newReadlist]);
      setSelectedReadlists((prev) => new Set([...prev, newReadlist.id]));
      setNewReadlistName("");
      setCreatingReadlist(false);
    }
  } catch (error) {
    console.error("Error creating readlist:", error);
  }
};


  if (!book) return null;

  return (
    <div className="readlist-popup-overlay">
      <div className="readlist-popup">
        <h2>Manage Readlists</h2>
        <p>Select the readlists to add/remove this book:</p>

        <ul className="readlist-options">
          {readlists.map((readlist) => (
            <li key={readlist.id}>
              <label>
                <input
                  type="checkbox"
                  checked={selectedReadlists.has(readlist.id)}
                  onChange={() => handleToggleReadlist(readlist.id)}
                />
                {readlist.name}
              </label>
            </li>
          ))}
        </ul>

        {/* Create a new readlist UI */}
        {creatingReadlist ? (
          <div className="create-readlist">
            <input
              type="text"
              placeholder="New Readlist Name"
              value={newReadlistName}
              onChange={(e) => setNewReadlistName(e.target.value)}
            />
            <button onClick={handleCreateReadlist}>Create</button>
            <button onClick={() => setCreatingReadlist(false)}>Cancel</button>
          </div>
        ) : (
          <button
            className="add-readlist-button"
            onClick={() => setCreatingReadlist(true)}
          >
            + Create New Readlist
          </button>
        )}

        <div className="popup-actions">
          <button onClick={handleSave}>Apply</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default ReadlistPopup;
