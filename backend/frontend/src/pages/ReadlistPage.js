import React, { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import Navigation from "../components/Navigation";
import BookList from "../components/BookList";
import { AuthContext } from "../AuthContext";
import { ThemeContext } from "../ThemeContext";
import "../styles/Readlist.css";

const ReadlistPage = () => {
  const { readlistId } = useParams();
  const { user } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const [readlistName, setReadlistName] = useState("Loading...");
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    const fetchReadlist = async () => {
      if (!user?.token) return;

      try {
        const response = await fetch(`${apiBaseUrl}/readlists/${readlistId}/`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setReadlistName(data.name || "My Readlist"); 
        }
      } catch (error) {
        console.error("Error fetching readlist:", error);
      }
    };

    fetchReadlist();
  }, [user, readlistId, apiBaseUrl]);

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Navigation />
      <div className={`readlist-container ${theme === 'dark' ? 'dark-mode' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <BookList 
            apiEndpoint={`${apiBaseUrl}/readlists/${readlistId}/`} 
            title={readlistName} 
            allowRemove={true} 
            theme={theme}
          />
        </div>
      </div>
    </div>
  );
};

export default ReadlistPage;
