import React, { useState, useEffect } from "react";

const ReadlistPopup = ({ book, onClose, onSave }) => {
  const [readlists, setReadlists] = useState([]);
  const [selectedReadlists, setSelectedReadlists] = useState(new Set());

  useEffect(() => {
    // Fetch the user's readlists from the backend
    const fetchReadlists = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/readlists/", {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setReadlists(data);
          // Check which readlists the book is already in
          const currentLists = new Set(
            data
              .filter((list) =>
                list.books.some((b) => b.google_books_id === book.google_books_id)
              )
              .map((list) => list.id)
          );
          setSelectedReadlists(currentLists);
        }
      } catch (error) {
        console.error("Error fetching readlists:", error);
      }
    };

    if (book) fetchReadlists();
  }, [book]);

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

  const handleSave = async () => {
    try {
      await fetch("http://127.0.0.1:8000/api/readlists/update/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          book_id: book.google_books_id,
          readlist_ids: Array.from(selectedReadlists),
        }),
      });
      onSave();
    } catch (error) {
      console.error("Error updating readlists:", error);
    }
  };

  if (!book) return null;

  return (
    <div className="readlist-popup-overlay">
      <div className="readlist-popup">
        <h2>Manage Readlists</h2>
        <p>Select the readlists to add/remove this book:</p>
        <ul>
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
        <div className="popup-actions">
          <button onClick={handleSave}>Apply</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default ReadlistPopup;
